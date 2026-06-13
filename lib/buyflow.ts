import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  type Connection,
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  getMint,
} from '@solana/spl-token'
import { supabase } from '@/lib/supabase'
import { getConfig, type Network } from './config'

type SendTxFn = (tx: Transaction, connection: Connection) => Promise<string>

// ── SOL transfer ─────────────────────────────────────────────

export async function sendSolPayment(
  amount: number,
  buyerWallet: PublicKey,
  connection: Connection,
  sendTransaction: SendTxFn,
  network: Network,
): Promise<string> {
  const cfg         = getConfig(network)
  const storeWallet = new PublicKey(cfg.storeWallet)
  const lamports    = Math.round(amount * LAMPORTS_PER_SOL)

  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: buyerWallet, toPubkey: storeWallet, lamports })
  )

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  tx.recentBlockhash = blockhash
  tx.feePayer = buyerWallet

  const signature = await sendTransaction(tx, connection)
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
  return signature
}

// ── SPL token transfer (USDC / IMOUT / KART) ─────────────────

export async function sendSplPayment(
  mintAddress: string | null,
  amount: number,
  buyerWallet: PublicKey,
  connection: Connection,
  sendTransaction: SendTxFn,
  network: Network,
): Promise<string> {
  if (!mintAddress) throw new Error('Not available on devnet')

  const cfg         = getConfig(network)
  const storeWallet = new PublicKey(cfg.storeWallet)
  const mint        = new PublicKey(mintAddress)
  const mintInfo    = await getMint(connection, mint)
  const rawAmount   = BigInt(Math.round(amount * 10 ** mintInfo.decimals))

  const buyerAta = await getAssociatedTokenAddress(mint, buyerWallet)
  const storeAta = await getAssociatedTokenAddress(mint, storeWallet)

  const tx = new Transaction()

  // Idempotent: creates store ATA if missing, no-ops if it already exists.
  tx.add(createAssociatedTokenAccountIdempotentInstruction(buyerWallet, storeAta, storeWallet, mint))
  tx.add(createTransferInstruction(buyerAta, storeAta, buyerWallet, rawAmount))

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  tx.recentBlockhash = blockhash
  tx.feePayer = buyerWallet

  const signature = await sendTransaction(tx, connection)
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
  return signature
}

// ── Record in Supabase + mark artwork sold ───────────────────

export async function recordTransaction(
  artworkId: string,
  buyerId: string | null,
  amount: number,
  currency: string,
  txSignature: string,
  network?: Network,
): Promise<void> {
  if (buyerId) {
    const row: Record<string, unknown> = {
      artwork_id:   artworkId,
      buyer_id:     buyerId,
      amount,
      currency,
      tx_signature: txSignature,
      status:       'confirmed',
    }
    if (network) row.network = network

    const { error } = await supabase.from('transactions').insert(row)
    if (error) console.error('[buyflow] record transaction:', error.message)
  }

  // Always mark sold regardless of auth state
  const { error: soldErr } = await supabase
    .from('artworks')
    .update({ status: 'sold' })
    .eq('id', artworkId)
  if (soldErr) console.error('[buyflow] mark sold:', soldErr.message)
}

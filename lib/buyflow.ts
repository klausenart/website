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
  network: Network,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  console.log('[buyflow] recordTransaction called', { artworkId, buyerId, amount, currency, txSignature, network })
  console.log('[buyflow] auth session uid:', session?.user?.id ?? 'NO SESSION')

  if (buyerId) {
    const row = {
      artwork_id:   artworkId,
      buyer_id:     buyerId,
      amount,
      currency,
      tx_signature: txSignature,
      status:       'confirmed',
      network,
    }
    console.log('[buyflow] inserting transaction row:', JSON.stringify(row, null, 2))

    const { data, error } = await supabase.from('transactions').insert(row).select()
    if (error) {
      console.error('[buyflow] insert FAILED — full error:', JSON.stringify(error, null, 2))
      console.error('[buyflow] error.message:', error.message)
      console.error('[buyflow] error.code:', error.code)
      console.error('[buyflow] error.details:', error.details)
      console.error('[buyflow] error.hint:', error.hint)
    } else {
      console.log('[buyflow] insert OK — returned row:', JSON.stringify(data, null, 2))
    }
  } else {
    console.warn('[buyflow] buyerId is null — skipping transaction insert (guest purchase)')
  }

  // Always mark sold regardless of auth state
  console.log('[buyflow] marking artwork sold:', artworkId)
  const { error: soldErr } = await supabase
    .from('artworks')
    .update({ status: 'sold' })
    .eq('id', artworkId)
  if (soldErr) {
    console.error('[buyflow] mark sold FAILED — full error:', JSON.stringify(soldErr, null, 2))
  } else {
    console.log('[buyflow] artwork marked sold OK')
  }
}

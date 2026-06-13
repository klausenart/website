import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  none,
  some,
  publicKey as toUmiPublicKey,
  type Umi,
} from '@metaplex-foundation/umi'
import {
  mplTokenMetadata,
  createNft,
  verifyCollectionV1,
  findMetadataPda,
} from '@metaplex-foundation/mpl-token-metadata'
import bs58 from 'bs58'
import { getConfig, type Network } from './config'

// ── Authority ─────────────────────────────────────────────────

function loadAuthority(umi: Umi) {
  const raw = process.env.MINTING_AUTHORITY_PRIVATE_KEY
  if (!raw) throw new Error('MINTING_AUTHORITY_PRIVATE_KEY env var is not set')
  const secretKey = bs58.decode(raw)
  return umi.eddsa.createKeypairFromSecretKey(secretKey)
}

// ── UMI factory ───────────────────────────────────────────────

export function getMintingUmi(network: Network): Umi {
  const cfg = getConfig(network)
  const umi = createUmi(cfg.rpc).use(mplTokenMetadata())
  umi.use(keypairIdentity(loadAuthority(umi)))
  return umi
}

// ── Metadata URI ──────────────────────────────────────────────
// Uploads metadata JSON to Cloudinary as a raw file and returns the
// secure_url. Cloudinary URLs are short (~80 chars) — well within
// Metaplex's 200-char limit. No IPFS/Arweave needed for MVP.

async function uploadMetadataToCloudinary(metadata: object): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName) throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set')

  const json = JSON.stringify(metadata)
  const blob = new Blob([json], { type: 'application/json' })

  const form = new FormData()
  form.append('file', blob, 'metadata.json')
  form.append('upload_preset', 'klausenart')
  form.append('resource_type', 'raw')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    { method: 'POST', body: form },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cloudinary metadata upload failed: ${text}`)
  }

  const data = await res.json() as { secure_url: string }
  return data.secure_url
}

// ── mintSingleNFT ─────────────────────────────────────────────

export async function mintSingleNFT(params: {
  name: string
  description: string
  imageUrl: string
  network: Network
  collectionMint?: string
}): Promise<{ mint: string; signature: string }> {
  const { name, description, imageUrl, network, collectionMint } = params
  const umi        = getMintingUmi(network)
  const mintSigner = generateSigner(umi)
  const uri        = await uploadMetadataToCloudinary({ name, description, image: imageUrl, attributes: [] })

  const { signature } = await createNft(umi, {
    mint:                mintSigner,
    name,
    uri,
    sellerFeeBasisPoints: percentAmount(0),
    collection: collectionMint
      ? some({ key: toUmiPublicKey(collectionMint), verified: false })
      : none(),
  }).sendAndConfirm(umi)

  // Verify collection membership on-chain immediately after minting
  if (collectionMint) {
    const metadata = findMetadataPda(umi, { mint: mintSigner.publicKey })
    await verifyCollectionV1(umi, {
      metadata,
      collectionMint: toUmiPublicKey(collectionMint),
    }).sendAndConfirm(umi)
  }

  return {
    mint:      mintSigner.publicKey.toString(),
    signature: bs58.encode(signature),
  }
}

// ── createCollection ──────────────────────────────────────────

export async function createCollection(params: {
  name: string
  description: string
  imageUrl: string
  network: Network
}): Promise<{ collectionMint: string; signature: string }> {
  const { name, description, imageUrl, network } = params
  const umi                  = getMintingUmi(network)
  const collectionMintSigner = generateSigner(umi)
  const uri                  = await uploadMetadataToCloudinary({ name, description, image: imageUrl, attributes: [] })

  const { signature } = await createNft(umi, {
    mint:                collectionMintSigner,
    name,
    uri,
    sellerFeeBasisPoints: percentAmount(0),
    isCollection:        true,
  }).sendAndConfirm(umi)

  return {
    collectionMint: collectionMintSigner.publicKey.toString(),
    signature:      bs58.encode(signature),
  }
}

// ── addNFTToCollection ────────────────────────────────────────

export async function addNFTToCollection(params: {
  nftMint: string
  collectionMint: string
  network: Network
}): Promise<{ signature: string }> {
  const { nftMint, collectionMint, network } = params
  const umi      = getMintingUmi(network)
  const metadata = findMetadataPda(umi, { mint: toUmiPublicKey(nftMint) })

  const { signature } = await verifyCollectionV1(umi, {
    metadata,
    collectionMint: toUmiPublicKey(collectionMint),
  }).sendAndConfirm(umi)

  return { signature: bs58.encode(signature) }
}

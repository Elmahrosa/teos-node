import fs from 'fs'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi'
import pkg from '@metaplex-foundation/mpl-bubblegum'
const lib = pkg.default || pkg
const { mplBubblegum, getAssetWithProof, burn } = lib

const KEY_PATH = "C:\\Users\\aams1\\teos-fresh\\wallet.json"
const HELIUS = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_KEY}`
const IDS = [
"HajK64CszM7QtVfVqb6q6rRbuUBTF3NuUX4oP2kFBQ7bjX9j","FEwPY6LamZv0swt5jr5vU5MgtKtt8dt12YFtGx8NA5I9d","C5t5q5hSLRBKW45N3Uydp9DRdSwabpDZEhvrkZYcXypx","BihDusiwxk3JuLHbCTCEyohCbuQR8dnUPyGejZUjS","BX7BN47oBg9NzecdSe5Gayb5BQwropgi4I1MPMB3U","BMRpJKsTDyaCfnqpMdklYbGtaPZ1MELAy3xQypcc8SvY","9i7nuQuz3CfW7i1BrjU6DyehZCUpX1sURnRsBAdQhqmY7F","9Hi5cfdhZ3WW4bWngoyMyeJpNdUf6RZeGaqqu1muHo2F","8PNSikS2Q3LpBW4Uk44kA3kLmnnJQpZ6AcKLxvKKbAr6V","7Q8gCos7Jv5x9rNLhKrSRDQ2X4JH1xRkN65FRyP8Z8","56nVRTWPEX18kG6wpxPU1nbhG6B2zS54rZKrX1R8W","49x7AqU7Y32k9Vf4kZsqEKhQSp1iKLhKFag90jvfTcssw","3tQNvFq8i7BaqyELURfGHRMbodtGLeMqfkX7qiqpLbY","3Z2ZvGEmAAkMLbhB6J5MDQpejWWLEVbL1i9d7d7RXmJ","3R1VCighEabwEqrJ5kRzSb23FxJwZngG65fj9g2Bkhf","KC92uHzKg1uMj1AWKq74yhwvFNaivkf55L7xWuxJkpb",
"HjtXEB2W8jf2rYMdspV2PNWjXJouyHBLgXc7fwLVkA9cP","CPbuqLDQ2n5nN4GckkPCripEuuiN938P9MzT9zcmT43m","AhuWyNXDtqO7dk9XuB1LCvdTKNg4vEaKHm3PUCch3","AL6h16i3dEUqG47GE7y49f5d6GuE3QW6Z3ph5YPgEtw","A7U9C5SnVgZ8JqRpFfXwW6gPczMNBJgjzD3aS48B8ak7VJ","89Wkx7TtoYxMvJQZLDy6FEVDU9d7vYTJdCwsLsxSjQhW","5QphJx7BgkBYNCIStUn8EEXVX3X7gX8qFHNUippe2s","3J45n8ZV5rN6ryMVS58Bd7N9pkiSZ83maVgFS652RV7P"
]

async function main(){
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(KEY_PATH,'utf8')))
  const umi = createUmi(HELIUS).use(mplBubblegum())
  const kp = umi.eddsa.createKeypairFromSecretKey(secret)
  umi.use(keypairIdentity(kp))
  const bal = await umi.rpc.getBalance(kp.publicKey)
  console.log("رصيدك حاليا:", Number(bal.basisPoints)/1e9, "SOL")
  if(Number(bal.basisPoints) < 5000000){ console.log("❌ لازم تشحن 0.03 SOL الأول"); return }

  for(const id of IDS){
    try{
      const ap = await getAssetWithProof(umi, publicKey(id))
      await burn(umi, {
        leafOwner: ap.leafOwner, leafDelegate: ap.leafDelegate,
        merkleTree: ap.merkleTree, root: ap.root, nonce: ap.nonce,
        index: ap.index, leafIndex: ap.index, proof: ap.proof,
        dataHash: ap.dataHash, creatorHash: ap.creatorHash,
      }).sendAndConfirm(umi)
      console.log("✅ اتحرق", id.slice(0,8))
    }catch(e){ console.log("❌ فشل", id.slice(0,8), e.message) }
  }
  console.log("\nخلصنا! شغل check-live.mjs تاني هتلاقي 0")
}
main()

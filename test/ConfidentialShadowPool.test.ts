import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import {
  ConfidentialShadowPool,
  ConfidentialShadowPool__factory,
} from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import type { Log } from "ethers";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("ConfidentialShadowPool")) as ConfidentialShadowPool__factory;
  const contract = (await factory.deploy()) as ConfidentialShadowPool;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

const TOKEN_A = "0x1111111111111111111111111111111111111111";
const TOKEN_B = "0x2222222222222222222222222222222222222222";
const TOKEN_C = "0x3333333333333333333333333333333333333333";
const SELL_AMT = 1_000_000;
const MIN_OUT = 500_000;

describe("ConfidentialShadowPool", function () {
  let signers: Signers;
  let contract: ConfidentialShadowPool;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3],
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This test suite requires FHEVM mock environment");
      this.skip();
    }
    ({ contract, contractAddress } = await deployFixture());
  });

  describe("Intent Creation", function () {
    it("should create an encrypted intent", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const encAmt = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(SELL_AMT).encrypt();
      const encMin = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(MIN_OUT).encrypt();

      await contract.connect(signers.alice).createIntent(TOKEN_A, TOKEN_B, encAmt.handles[0], encAmt.inputProof, encMin.handles[0], encMin.inputProof, deadline);

      const intentId = await contract.getActiveIntentId(signers.alice.address);
      expect(intentId).to.not.eq(ethers.ZeroHash);

      const onchain = await contract.getIntentAmountIn(intentId);
      const clear = await fhevm.userDecryptEuint(FhevmType.euint128, onchain, contractAddress, signers.alice);
      expect(Number(clear)).to.eq(SELL_AMT);
    });

    it("should not allow duplicate active intents", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const encAmt = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(SELL_AMT).encrypt();
      const encMin = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(MIN_OUT).encrypt();

      await contract.connect(signers.alice).createIntent(TOKEN_A, TOKEN_B, encAmt.handles[0], encAmt.inputProof, encMin.handles[0], encMin.inputProof, deadline);

      await expect(
        contract.connect(signers.alice).createIntent(TOKEN_A, TOKEN_B, encAmt.handles[0], encAmt.inputProof, encMin.handles[0], encMin.inputProof, deadline)
      ).to.be.revertedWith("SP: already active");
    });

    it("should not allow same token swap", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const encAmt = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(SELL_AMT).encrypt();
      const encMin = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(MIN_OUT).encrypt();

      await expect(
        contract.connect(signers.alice).createIntent(TOKEN_A, TOKEN_A, encAmt.handles[0], encAmt.inputProof, encMin.handles[0], encMin.inputProof, deadline)
      ).to.be.revertedWith("SP: same token");
    });

    it("should cancel an intent", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const encAmt = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(SELL_AMT).encrypt();
      const encMin = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(MIN_OUT).encrypt();

      await contract.connect(signers.alice).createIntent(TOKEN_A, TOKEN_B, encAmt.handles[0], encAmt.inputProof, encMin.handles[0], encMin.inputProof, deadline);

      const intentId = await contract.getActiveIntentId(signers.alice.address);

      await contract.connect(signers.alice).cancelIntent(intentId);
      const active = await contract.isIntentActive(intentId);
      expect(active).to.eq(false);
    });

    it("should allow creating new intent after cancel", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const encAmt = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(SELL_AMT).encrypt();
      const encMin = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(MIN_OUT).encrypt();

      // Create first intent
      await contract.connect(signers.alice).createIntent(TOKEN_A, TOKEN_B, encAmt.handles[0], encAmt.inputProof, encMin.handles[0], encMin.inputProof, deadline);
      const firstId = await contract.getActiveIntentId(signers.alice.address);
      expect(firstId).to.not.eq(ethers.ZeroHash);

      // Cancel it
      await contract.connect(signers.alice).cancelIntent(firstId);
      expect(await contract.isIntentActive(firstId)).to.eq(false);

      // Create a second intent (same user, new intent)
      const encAmt2 = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(SELL_AMT).encrypt();
      const encMin2 = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(MIN_OUT).encrypt();
      await contract.connect(signers.alice).createIntent(TOKEN_B, TOKEN_A, encAmt2.handles[0], encAmt2.inputProof, encMin2.handles[0], encMin2.inputProof, deadline);

      const secondId = await contract.getActiveIntentId(signers.alice.address);
      expect(secondId).to.not.eq(ethers.ZeroHash);
      expect(secondId).to.not.eq(firstId);

      // Verify the new intent is active
      expect(await contract.isIntentActive(secondId)).to.eq(true);
      const onchain = await contract.getIntentAmountIn(secondId);
      const clear = await fhevm.userDecryptEuint(FhevmType.euint128, onchain, contractAddress, signers.alice);
      expect(Number(clear)).to.eq(SELL_AMT);
    });
  });

  describe("Intent Matching", function () {
    let aliceId: string;

    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const encAmt = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(SELL_AMT).encrypt();
      const encMin = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(MIN_OUT).encrypt();
      await contract.connect(signers.alice).createIntent(TOKEN_A, TOKEN_B, encAmt.handles[0], encAmt.inputProof, encMin.handles[0], encMin.inputProof, deadline);
      aliceId = await contract.getActiveIntentId(signers.alice.address);
    });

    it("should match an intent and deactivate it", async function () {
      const encIn = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(MIN_OUT).encrypt();
      const encOut = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(SELL_AMT).encrypt();

      await contract.connect(signers.bob).matchIntent(aliceId, encIn.handles[0], encIn.inputProof, encOut.handles[0], encOut.inputProof);

      expect(await contract.isIntentActive(aliceId)).to.eq(false);
      expect(await contract.hasActiveIntent(signers.alice.address)).to.eq(false);
    });

    it("should not allow matching own intent", async function () {
      const encIn = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(MIN_OUT).encrypt();
      const encOut = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add128(SELL_AMT).encrypt();
      await expect(
        contract.connect(signers.alice).matchIntent(aliceId, encIn.handles[0], encIn.inputProof, encOut.handles[0], encOut.inputProof)
      ).to.be.revertedWith("SP: cannot match self");
    });

    it("should not allow matching with active intent", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const encA = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(100).encrypt();
      const encB = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(100).encrypt();
      await contract.connect(signers.bob).createIntent(TOKEN_B, TOKEN_A, encA.handles[0], encA.inputProof, encB.handles[0], encB.inputProof, deadline);

      const encIn = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(MIN_OUT).encrypt();
      const encOut = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(SELL_AMT).encrypt();
      await expect(
        contract.connect(signers.bob).matchIntent(aliceId, encIn.handles[0], encIn.inputProof, encOut.handles[0], encOut.inputProof)
      ).to.be.revertedWith("SP: cancel first");
    });

    it("should allow both parties to decrypt match amounts", async function () {
      const encIn = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(MIN_OUT).encrypt();
      const encOut = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(SELL_AMT).encrypt();

      const tx = await contract.connect(signers.bob).matchIntent(aliceId, encIn.handles[0], encIn.inputProof, encOut.handles[0], encOut.inputProof);
      const receipt = await tx.wait();

      // Parse the MatchExecuted event from logs to extract the matchId
      const matchExecutedTopic = contract.interface.getEvent("MatchExecuted")!.topicHash;
      const matchLog = receipt!.logs.find(
        (l: Log) => l.topics[0] === matchExecutedTopic
      )!;
      const parsedLog = contract.interface.parseLog({
        data: matchLog.data,
        topics: matchLog.topics as [string, ...string[]],
      });
      const matchId: string = parsedLog!.args.matchId;

      // Verify matchId is not zero
      expect(matchId).to.not.eq(ethers.ZeroHash);

      // Get encrypted match amounts
      const matchAmountIn = await contract.getMatchAmountIn(matchId);
      const matchAmountOut = await contract.getMatchAmountOut(matchId);

      // Alice (partyA) should be able to decrypt
      const aliceDecryptedIn = await fhevm.userDecryptEuint(FhevmType.euint128, matchAmountIn, contractAddress, signers.alice);
      const aliceDecryptedOut = await fhevm.userDecryptEuint(FhevmType.euint128, matchAmountOut, contractAddress, signers.alice);
      expect(Number(aliceDecryptedIn)).to.eq(SELL_AMT);
      expect(Number(aliceDecryptedOut)).to.eq(SELL_AMT);

      // Bob (partyB) should also be able to decrypt
      const bobDecryptedIn = await fhevm.userDecryptEuint(FhevmType.euint128, matchAmountIn, contractAddress, signers.bob);
      const bobDecryptedOut = await fhevm.userDecryptEuint(FhevmType.euint128, matchAmountOut, contractAddress, signers.bob);
      expect(Number(bobDecryptedIn)).to.eq(SELL_AMT);
      expect(Number(bobDecryptedOut)).to.eq(SELL_AMT);
    });

    it("should show match details", async function () {
      const encIn = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(MIN_OUT).encrypt();
      const encOut = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(SELL_AMT).encrypt();

      const tx = await contract.connect(signers.bob).matchIntent(aliceId, encIn.handles[0], encIn.inputProof, encOut.handles[0], encOut.inputProof);
      const receipt = await tx.wait();

      // Parse MatchExecuted event for matchId
      const matchExecutedTopic = contract.interface.getEvent("MatchExecuted")!.topicHash;
      const matchLog = receipt!.logs.find(
        (l: Log) => l.topics[0] === matchExecutedTopic
      )!;
      const parsedLog = contract.interface.parseLog({
        data: matchLog.data,
        topics: matchLog.topics as [string, ...string[]],
      });
      const matchId: string = parsedLog!.args.matchId;

      // Read the match struct via the public mapping
      const matchResult = await contract.matches(matchId);

      expect(matchResult.partyA).to.eq(signers.alice.address);
      expect(matchResult.partyB).to.eq(signers.bob.address);
      expect(matchResult.tokenIn).to.eq(TOKEN_A);
      expect(matchResult.tokenOut).to.eq(TOKEN_B);
      expect(matchResult.timestamp).to.be.gt(0);

      // Both parties should be able to decrypt amounts from the struct
      const aliceDecIn = await fhevm.userDecryptEuint(FhevmType.euint128, matchResult.amountIn, contractAddress, signers.alice);
      const aliceDecOut = await fhevm.userDecryptEuint(FhevmType.euint128, matchResult.amountOut, contractAddress, signers.alice);
      expect(Number(aliceDecIn)).to.eq(SELL_AMT);
      expect(Number(aliceDecOut)).to.eq(SELL_AMT);

      // getMatchAmountIn/Out should return the same encrypted handles as the struct
      const matchAmountIn = await contract.getMatchAmountIn(matchId);
      const matchAmountOut = await contract.getMatchAmountOut(matchId);
      expect(matchAmountIn).to.eq(matchResult.amountIn);
      expect(matchAmountOut).to.eq(matchResult.amountOut);
    });

    it("should handle multiple matches across different users", async function () {
      // Bob matches Alice's intent
      const encIn = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(MIN_OUT).encrypt();
      const encOut = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(SELL_AMT).encrypt();

      const tx1 = await contract.connect(signers.bob).matchIntent(aliceId, encIn.handles[0], encIn.inputProof, encOut.handles[0], encOut.inputProof);
      const receipt1 = await tx1.wait();

      // Parse matchId for first match
      const matchExecutedTopic = contract.interface.getEvent("MatchExecuted")!.topicHash;
      const matchLog1 = receipt1!.logs.find(
        (l: Log) => l.topics[0] === matchExecutedTopic
      )!;
      const parsedLog1 = contract.interface.parseLog({
        data: matchLog1.data,
        topics: matchLog1.topics as [string, ...string[]],
      });
      const matchId1: string = parsedLog1!.args.matchId;
      expect(matchId1).to.not.eq(ethers.ZeroHash);

      // Alice's intent should be inactive now
      expect(await contract.isIntentActive(aliceId)).to.eq(false);
      expect(await contract.hasActiveIntent(signers.alice.address)).to.eq(false);

      // Charlie creates a new intent
      const deadline2 = Math.floor(Date.now() / 1000) + 3600;
      const encAmtC = await fhevm.createEncryptedInput(contractAddress, signers.charlie.address).add128(750_000).encrypt();
      const encMinC = await fhevm.createEncryptedInput(contractAddress, signers.charlie.address).add128(300_000).encrypt();
      await contract.connect(signers.charlie).createIntent(TOKEN_C, TOKEN_A, encAmtC.handles[0], encAmtC.inputProof, encMinC.handles[0], encMinC.inputProof, deadline2);

      const charlieId = await contract.getActiveIntentId(signers.charlie.address);
      expect(charlieId).to.not.eq(ethers.ZeroHash);
      expect(await contract.hasActiveIntent(signers.charlie.address)).to.eq(true);

      // Bob (who no longer has an active intent) can match Charlie's intent
      const encIn2 = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(300_000).encrypt();
      const encOut2 = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(750_000).encrypt();

      const tx2 = await contract.connect(signers.bob).matchIntent(charlieId, encIn2.handles[0], encIn2.inputProof, encOut2.handles[0], encOut2.inputProof);
      const receipt2 = await tx2.wait();

      // Parse matchId for second match
      const matchLog2 = receipt2!.logs.find(
        (l: Log) => l.topics[0] === matchExecutedTopic
      )!;
      const parsedLog2 = contract.interface.parseLog({
        data: matchLog2.data,
        topics: matchLog2.topics as [string, ...string[]],
      });
      const matchId2: string = parsedLog2!.args.matchId;
      expect(matchId2).to.not.eq(ethers.ZeroHash);
      expect(matchId2).to.not.eq(matchId1);

      // Verify Charlie's intent is now inactive
      expect(await contract.isIntentActive(charlieId)).to.eq(false);

      // Verify both matches have distinct matchIds and correct parties
      const match1 = await contract.matches(matchId1);
      const match2 = await contract.matches(matchId2);

      expect(match1.partyA).to.eq(signers.alice.address);
      expect(match1.partyB).to.eq(signers.bob.address);
      expect(match1.tokenIn).to.eq(TOKEN_A);
      expect(match1.tokenOut).to.eq(TOKEN_B);

      expect(match2.partyA).to.eq(signers.charlie.address);
      expect(match2.partyB).to.eq(signers.bob.address);
      expect(match2.tokenIn).to.eq(TOKEN_C);
      expect(match2.tokenOut).to.eq(TOKEN_A);

      // Verify decryption works for all parties across both matches
      const aliceDecIn = await fhevm.userDecryptEuint(FhevmType.euint128, match1.amountIn, contractAddress, signers.alice);
      expect(Number(aliceDecIn)).to.eq(SELL_AMT);

      const charlieDecIn = await fhevm.userDecryptEuint(FhevmType.euint128, match2.amountIn, contractAddress, signers.charlie);
      expect(Number(charlieDecIn)).to.eq(750_000);

      // Bob can decrypt both matches
      const bobDecIn1 = await fhevm.userDecryptEuint(FhevmType.euint128, match1.amountIn, contractAddress, signers.bob);
      const bobDecIn2 = await fhevm.userDecryptEuint(FhevmType.euint128, match2.amountIn, contractAddress, signers.bob);
      expect(Number(bobDecIn1)).to.eq(SELL_AMT);
      expect(Number(bobDecIn2)).to.eq(750_000);
    });

    it("should not match expired intents", async function () {
      // Create an intent with a future deadline
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const encAmt = await fhevm.createEncryptedInput(contractAddress, signers.charlie.address).add128(SELL_AMT).encrypt();
      const encMin = await fhevm.createEncryptedInput(contractAddress, signers.charlie.address).add128(MIN_OUT).encrypt();
      await contract.connect(signers.charlie).createIntent(TOKEN_B, TOKEN_A, encAmt.handles[0], encAmt.inputProof, encMin.handles[0], encMin.inputProof, deadline);

      const charlieId = await contract.getActiveIntentId(signers.charlie.address);

      // Advance time past the deadline using evm_increaseTime
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      // Now try to match - should revert because expired
      const encIn = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(MIN_OUT).encrypt();
      const encOut = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add128(SELL_AMT).encrypt();
      await expect(
        contract.connect(signers.bob).matchIntent(charlieId, encIn.handles[0], encIn.inputProof, encOut.handles[0], encOut.inputProof)
      ).to.be.revertedWith("SP: expired");
    });
  });
});

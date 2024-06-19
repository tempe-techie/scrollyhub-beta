import { defineStore } from "pinia";
import { ethers } from "ethers";
import { useUserStore } from "~/store/user";
import { getActivityPoints } from "~/utils/balanceUtils";

export const useQuestStore = defineStore("questStore", {
  state: () => ({
    activityPoints: 0,
    showModal: false,
    selectedQuest: null,
    questDetails: "",
    hoveredQuest: null,
    selectedCategory: "all",
    claimStatus: null,
    eligibilityStatus: null,
    showPopup: false,
    popupMessage: "",
    questCategories: [
      {
        category: "Social Hub Quests",
        quests: [
          {
            id: 1,
            title: "Create your Scrolly Domains",
            description: "Create your Scrolly Domains",
            points: 0,
            validated: false,
            tbd: false,
            ended: false,
            image: "http://scrolly.xyz/img/quests/ScrollyDomains.png",
            contractAddress: "0xc2C543D39426bfd1dB66bBde2Dd9E4a5c7212876",
            functions: {
              checkBalance: "balanceOf",
            },
          },
          {
            id: 2,
            title: "Post Scrolly's Minter",
            description: "Mint your first post on the hub",
            points: 100,
            validated: false,
            tbd: false,
            ended: false,
            image: "http://scrolly.xyz/img/quests/ScrollyPostMinter.png",
            contractAddress: "0xFC9b5992CEEB886C2ba7d0F785E2839802E27DC1",
            functions: {
              isEligible: "isEligible",
              hasUserClaimed: "hasUserClaimed",
              claim: "claim",
            },
          },
          {
            id: 3,
            title: "Scrolly's Journey Owner",
            description:
              "Mint the Scrolly's Journey NFT Collection on the NFT Launchpad",
            points: 200,
            validated: false,
            tbd: false,
            ended: false,
            image: "http://scrolly.xyz/img/quests/ScrollyJourneyOwner.png",
            contractAddress: "0x0F06e87d431E90435677b83c056AED9d5e30761d",
            functions: {
              isEligible: "isEligible",
              hasUserClaimed: "hasUserClaimed",
              claim: "claim",
            },
          },
          {
            id: 4,
            title: "Scrolly's Artist",
            description:
              "Mint the Scrolly's Journey NFT Collection on the NFT Launchpad",
            points: 800,
            validated: false,
            tbd: false,
            ended: false,
            image: "http://scrolly.xyz/img/quests/ScrollyArtist.png",
            contractAddress: "0x875d479920B8c9564501DAb57EA1325EeA6FD99D",
            functions: {
              isEligible: "isEligible",
              hasUserClaimed: "hasUserClaimed",
              claim: "claim",
            },
          },
          // add other quests here
        ],
      },
      {
        category: "Scrolly DeFi",
        quests: [
          {
            id: 5,
            title: "Scrolly Staker on Zprotocol",
            description: "Stake at least $10 on ETH-Scrolly pair on Zprotocol.",
            points: 200,
            validated: false,
            tbd: true,
            ended: false,
            image: "http://scrolly.xyz/img/quests/ScrollyDeFi.png",
            contractAddress: "0xYourContractAddressForQuest5",
            functions: {
              isEligible: "isEligible",
              hasUserClaimed: "hasUserClaimed",
              claim: "claim",
            },
          },
          {
            id: 7,
            title: "Scrolly Yield Farmer",
            description:
              "Farm on Zprotocol for 7 consecutive days. You will be eligible for extra $ZP rewards too",
            points: 400,
            validated: false,
            tbd: true,
            ended: false,
            image: "http://scrolly.xyz/img/quests/ScrollyYield.png",
            contractAddress: "0xYourContractAddressForQuest5",
            functions: {
              isEligible: "isEligible",
              hasUserClaimed: "hasUserClaimed",
              claim: "claim",
            },
          },
          // add other quests here
        ],
      },
      {
        category: "Community Rewards",
        quests: [
          {
            id: 6,
            title: "Equilibre Memes Contestor",
            description:
              "Participate in the meme contest, share, and create as part of our community spirit. Regardless of winning, sharing and creating is what matters.",
            points: 50,
            validated: false,
            tbd: false,
            ended: false, // Marked as ended
            image: "http://scrolly.xyz/img/quests/ScrollyMemeConstest.png",
            contractAddress: "0x166E1FB48160D066C4724191463F4d3b298B3bbb",
            functions: {
              checkEligibility: "checkEligibility",
            },
          },
          // add other quests here
        ],
      },
      // add other categories here
    ],
  }),
  getters: {
    filteredCategories(state) {
      if (state.selectedCategory === "all") {
        return state.questCategories;
      }
      if (state.selectedCategory === "latest") {
        const allQuests = state.questCategories.flatMap(
          (category) => category.quests,
        );
        const latestQuests = allQuests.sort((a, b) => b.id - a.id).slice(0, 3);
        return [
          {
            category: "Latest Quests",
            quests: latestQuests,
          },
        ];
      }
      return state.questCategories.filter(
        (category) => category.category === state.selectedCategory,
      );
    },
    getCompletedQuests: (state) => (quests) => {
      return quests.filter((quest) => quest.validated).length;
    },
  },
  actions: {
    async initializeQuests(userStore) {
      this.userStore = userStore;
      await this.updateData();
    },
    async updateData() {
      await this.fetchActivityPoints();
      await this.checkDomainOwnership();
      await this.checkQuestConditions();
    },
    async fetchActivityPoints() {
      const userAddress = this.userStore.getCurrentUserAddress;
      if (userAddress) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        this.activityPoints = await getActivityPoints(userAddress, signer);
      }
    },
    async checkDomainOwnership() {
      const userAddress = this.userStore.getCurrentUserAddress;
      if (userAddress) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          "0xc2C543D39426bfd1dB66bBde2Dd9E4a5c7212876",
          ["function balanceOf(address owner) view returns (uint256)"],
          provider,
        );
        const balance = await contract.balanceOf(userAddress);

        let points = 169 * Math.min(balance.toNumber(), 3);
        const hubQuests = this.questCategories.find(
          (category) => category.category === "Social Hub Quests",
        );
        const quest = hubQuests.quests.find((q) => q.id === 1);
        quest.points = points;
        quest.validated = balance.toNumber() > 0;
      }
    },
    async checkQuestConditions() {
      const userAddress = this.userStore.getCurrentUserAddress;
      if (userAddress) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        for (const category of this.questCategories) {
          for (const quest of category.quests) {
            if (quest.id === 1) {
              await this.checkDomainOwnership();
            } else if (quest.id === 6) {
              const contract = new ethers.Contract(
                quest.contractAddress,
                [
                  `function ${quest.functions.checkEligibility}(address _user) external view returns (bool)`,
                ],
                provider,
              );
              const eligible =
                await contract[quest.functions.checkEligibility](userAddress);
              quest.validated = eligible;
            } else if (quest.functions) {
              const contract = new ethers.Contract(
                quest.contractAddress,
                [
                  `function ${quest.functions.isEligible}(address _user) external view returns (bool)`,
                  `function ${quest.functions.hasUserClaimed}(address _user) external view returns (bool)`,
                ],
                provider,
              );
              const hasClaimed =
                await contract[quest.functions.hasUserClaimed](userAddress);
              quest.validated = hasClaimed;
              if (!hasClaimed) {
                quest.eligible =
                  await contract[quest.functions.isEligible](userAddress);
              } else {
                quest.eligible = false;
              }
            }
          }
        }
      }
    },
    async checkEligibilityAndClaimStatus(contractAddress, functions) {
      const userAddress = this.userStore.getCurrentUserAddress;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        [
          `function ${functions.isEligible}(address _user) external view returns (bool)`,
          `function ${functions.hasUserClaimed}(address _user) external view returns (bool)`,
          `function ${functions.claim}(address _user) external`,
        ],
        signer,
      );

      const hasClaimed = await contract[functions.hasUserClaimed](userAddress);
      if (hasClaimed) {
        this.claimStatus = true;
        this.eligibilityStatus = false;
      } else {
        this.claimStatus = false;
        this.eligibilityStatus =
          await contract[functions.isEligible](userAddress);
      }
    },
    async claimReward(contractAddress, functions, points) {
      const userAddress = this.userStore.getCurrentUserAddress;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        [`function ${functions.claim}(address _user) external`],
        signer,
      );

      try {
        await contract[functions.claim](userAddress);
        this.claimStatus = true;
        this.showPopupMessage(
          `Congratulations! You have successfully claimed ${points} Mappy Points!`,
        );
        setTimeout(async () => {
          await this.updateData(); // Refresh quest status
        }, 5000);
      } catch (error) {
        this.showPopupMessage(
          "There was an issue processing your claim. Please try again later.",
        );
      }
    },
    showPopupMessage(message) {
      this.popupMessage = message;
      this.showPopup = true;
      setTimeout(() => {
        this.showPopup = false;
      }, 5000);
    },
    filterCategory(category) {
      this.selectedCategory = category;
    },
    async showQuestDetails(questId) {
      for (const category of this.questCategories) {
        const quest = category.quests.find((q) => q.id === questId);
        if (quest) {
          this.selectedQuest = quest;
          this.questDetails = quest.description;
          this.showModal = true;
          if (quest.id === 1) {
            await this.checkDomainOwnership();
          } else if (quest.id === 6) {
            const userAddress = this.userStore.getCurrentUserAddress;
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(
              quest.contractAddress,
              [
                `function ${quest.functions.checkEligibility}(address _user) external view returns (bool)`,
                `function ${quest.functions.hasUserClaimed}(address _user) external view returns (bool)`,
              ],
              provider,
            );
            this.claimStatus =
              await contract[quest.functions.checkEligibility](userAddress);
            quest.validated =
              await contract[quest.functions.hasUserClaimed](userAddress);
          } else {
            await this.checkEligibilityAndClaimStatus(
              quest.contractAddress,
              quest.functions,
            );
          }
          break;
        }
      }
    },
    closeModal() {
      this.showModal = false;
      this.selectedQuest = null;
      this.questDetails = "";
    },
    hoverQuest(questId) {
      this.hoveredQuest = questId;
    },
  },
});

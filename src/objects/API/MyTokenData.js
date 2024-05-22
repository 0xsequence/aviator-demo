import { Signal } from '../../utils/Signal';

export class MyTokenData {
  tokenBalances = new Map();
  tokenMetadatas = null;
  contractName = 'unknown contract';
  sleepCounter = 0;
  defaultSleepDuration = 15;
  isFastPolling = false;
  isFastPollingSignal = new Signal();
  balanceSignal = new Signal();
  metadataSignal = new Signal();
  detectedNothing = false
  constructor(
    indexer,
    metadata,
    accountAddress,
    chainID,
    contractAddress,
    metadataTokenIDs
  ) {
    this.indexer = indexer;
    this.metadata = metadata;
    this.accountAddress = accountAddress;
    this.contractAddress = contractAddress;
    if (metadataTokenIDs) {
      this.metadata
        .getTokenMetadata({
          accountAddress,
          contractAddress,
          chainID,
          tokenIDs: metadataTokenIDs,
        })
        .then(result => {
          this.tokenMetadatas = new Map()
          for (const item of result.tokenMetadata.filter(v => !!v)) {
            this.tokenMetadatas.set(item.tokenId, item);
          }
          this.metadataSignal.emit(this);
          if(!this.isFastPolling) {
            this.balanceSignal.emit(this)
          }
        });
    }
    this.update();
    setInterval(this.update, 1000);
  }
  expectChanges() {
    this.changeFastPollingState(true);
  }
  ownsAny(tokenID) {
    return (
      this.tokenBalances.has(tokenID) && this.tokenBalances.get(tokenID) > 0
    );
  }
  changeFastPollingState(active) {
    if (this.isFastPolling === active) {
      return;
    }
    this.defaultSleepDuration = active ? 0 : 15;
    this.sleepCounter = this.defaultSleepDuration;
    this.isFastPolling = active;
    this.isFastPollingSignal.emit(active);
  }
  update = () => {
    if (this.sleepCounter > 0) {
      this.sleepCounter--;
      return;
    }
    this.sleepCounter = this.defaultSleepDuration;
    const opts = {
      accountAddress: this.accountAddress,
      contractAddress: this.contractAddress,
    };
    this.indexer
      .getTokenBalances(opts)
      .then(results => {
        let balanceChangesDetected = false;
        if(results.balances.length === 0 && !this.detectedNothing) {
          this.detectedNothing = true
          balanceChangesDetected = true
        }
        for (const item of results.balances) {
          const balance = Number(item.balance);
          if (!this.tokenBalances.has(item.tokenID)) {
            balanceChangesDetected = true;
          } else if (this.tokenBalances.get(item.tokenID) !== balance) {
            balanceChangesDetected = true;
          }
          this.tokenBalances.set(item.tokenID, balance);
          if (item.contractInfo) {
            this.contractName = item.contractInfo.name;
          }
        }
        if (balanceChangesDetected) {
          this.balanceSignal.emit(this);
          this.changeFastPollingState(false);
        }
      })
      .catch(error => {
        console.log(error);
      });
  };
}

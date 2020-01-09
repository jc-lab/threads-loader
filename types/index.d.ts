declare module "threads-loader!*" {
  import { Worker } from '@jc-lab/threads';

  class WebpackThreadsWorker extends Worker {
    constructor();
  }

  export default WebpackThreadsWorker;
}

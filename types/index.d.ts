declare module "threads-loader!*" {
  import { Worker } from 'threads';

  class WebpackThreadsWorker extends Worker {
    constructor();
  }

  export default WebpackThreadsWorker;
}

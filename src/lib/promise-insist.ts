export type DelayFunc = ((maxRetries: number, retries: number) => number);
export type TaskRetriever<T> = () => Promise<T>;
export type ID = number | string;
export type ErrorFilter = (error: any) => boolean;
export type CancelResolver = (any) => any;
export type RetryCallback = ((attempts: number, timeConsumed: number) => void) | null | undefined;

export type Config = {
    retries?: number;
    delay?: number | DelayFunc;
    errorFilter?: ErrorFilter;
};

interface MetaData {
    task?: TaskRetriever<any>;
    canceled?: boolean;
    cancelResolver?: CancelResolver;
    timeout?: any;
    starttime?: number;
    onRetry?: RetryCallback;
    resolve?;
}

export default class PromiseInsist {

    //global config per instance.
    private globalConfig: Config = {
        retries: 10,
        delay: 1000,
        errorFilter: err => true
    };

    private taskMeta: Map<number | string, MetaData> = new Map();
    public verbose: boolean = true;

    /**
     *
     * @param retries Number of retries, default is 10
     * @param delay the delay in ms as a Number or DelayFunc, Default is 1000
     * @param errorFilter a function that allows retrying only the whitelisted error.
     */

    constructor(config?: Config) {
        if (config !== undefined) {
            const { retries, delay, errorFilter } = config;
            if (retries !== undefined) { this.globalConfig.retries = retries; }
            if (delay !== undefined) { this.globalConfig.delay = delay; }
            if (errorFilter !== undefined) { this.globalConfig.errorFilter = errorFilter; }
        }
        this.insist = this.insist.bind(this);
        this.cancel = this.cancel.bind(this);
        this.replaceTask = this.replaceTask.bind(this);
        this.addRetryHook = this.addRetryHook.bind(this);
    }

    /**
     *
     * @param id the id associated with the retryable promise/task
     */

    public async cancel(id) {
        return new Promise(async (resolve) => {
            const meta = this.taskMeta.get(id);
            if (meta === undefined ||
                !('timeout' in meta) ||
                meta.canceled === true
            ) {
                resolve();
            } else {
                clearTimeout(meta.timeout);
                this.taskMeta.set(id, { ...meta, canceled: true, cancelResolver: resolve });
                meta.resolve();
            }
        });
    }

    /**
     * Insists on resolving the promise via x tries
     * @param id ID of the promise/task
     * @param promiseRetriever A function that when executed returns a promise
     * @param config
     * Optional configuration , if not specified the config passed in the constructor will be used,
     * if that latter wasn't specified either, the default will be used .
     */

    public async insist<T>(
        id: ID,
        taskRetriever: TaskRetriever<T>,
        retryHook?: RetryCallback,
        config: Config = this.globalConfig
    ): Promise<T> {
        if (this.taskMeta.has(id)) {
            throw new Error('Task is still pending, if you want to cancel it call cancel(id).');
        }
        this.taskMeta.set(id, { canceled: false, starttime: Date.now(), onRetry: retryHook });
        return this._insist<T>(id, taskRetriever, config, config.retries!);
    }

    public replaceTask<T>(id: ID, taskRetriever: TaskRetriever<T>): Promise<void> {
        const meta = this.taskMeta.get(id);
        if (meta !== undefined) {
            meta.task = taskRetriever;
        }
        return Promise.resolve();
    }
    public async addRetryHook<T>(id: ID, callback: RetryCallback): Promise<void> {
        const meta = this.taskMeta.get(id);
        if (meta !== undefined) {
            meta.onRetry = callback;
        }

        return Promise.resolve();
    }

    private async _insist<T>(
        id: ID,
        taskRetriever: TaskRetriever<T>,
        config: Config,
        maxRetries: number
    ): Promise<T> {

        const taskStarttime = Date.now();
        try {
            const result = await taskRetriever();
            this.taskMeta.delete(id);
            return result;
        } catch (err) {
            const metaData = <MetaData>this.taskMeta.get(id);
            //required in case promise was revoked twice after cancel()
            if (metaData === undefined) {
                return Promise.resolve(err);
            }
            delete metaData.timeout;

            if (!config.errorFilter!(err) ||
                config.retries === 0 ||
                metaData.canceled
            ) {
                if (this.verbose && metaData.canceled) {
                    console.log(`Canceled task of ID : ${id} (~ ${Date.now() - (metaData.starttime || 0)} ms)`);
                }
                this.taskMeta.delete(id);
                if (typeof metaData.cancelResolver === 'function') {
                    metaData.cancelResolver({ id, time: Date.now() - (metaData.starttime || 0) });
                }
                return Promise.reject(err);
            }
            let delay = config.delay;
            if (typeof delay === 'function') {
                delay = delay(maxRetries, config.retries!);
            }
            if (metaData.onRetry) {
                metaData.onRetry(config.retries! - 1, Math.max(taskStarttime - Date.now(), 0));
            }
            if (this.verbose) {
                console.log(`Retrying ${id} after ${delay} ms`);
            }
            config.retries! -= 1;

            return new Promise<T>(
                resolve => {
                    metaData.resolve = async () => resolve(this._insist<T>
                        (
                        id, (metaData.task ? metaData.task : taskRetriever),
                        config, maxRetries
                        ));
                    metaData.timeout = setTimeout(metaData.resolve, <number>delay);
                });
        }
    }

}

/* tslint:disable:no-console */
/**
 * Logger functions
 */

class Log {
    static d(...value: any) {
        console.log(new Date(), "  ", ...value);
    }
    static w(...value: any) {
        console.warn(new Date(), "  ", ...value);
    }

    static e(...value: any) {
        console.error(new Date(), "  ", ...value);
    }
}

export default Log;

import { History } from 'history';
import * as React from 'react';

export interface NavigationOptions {
    event?: React.MouseEvent;
    replace?: boolean;
    /**
     * Skip the navigation if it would leave the URL unchanged, ignoring the order of the query
     * parameters. Browsers rate limit history updates and fail once the limit is reached, so this is
     * useful for callers that report unchanged state, such as components writing their state on mount.
     */
    skipIfUnchanged?: boolean;
}

export interface NavigationApi {
    goto(path: string, query?: {[name: string]: any}, options?: NavigationOptions): void;
}

function sameParams(left: URLSearchParams, right: URLSearchParams): boolean {
    const sortedLeft = new URLSearchParams(left);
    const sortedRight = new URLSearchParams(right);
    sortedLeft.sort();
    sortedRight.sort();
    return sortedLeft.toString() === sortedRight.toString();
}

export class NavigationManager implements NavigationApi {

    private history: History;

    constructor(history: History) {
        this.history = history;
    }

    public goto(path: string, query: {[name: string]: any} = {}, options?: NavigationOptions): void {
        if (path.startsWith('.')) {
            path = this.history.location.pathname + path.slice(1);
        }
        const noPathChange = path === this.history.location.pathname;
        const params = noPathChange ? new URLSearchParams(this.history.location.search) : new URLSearchParams();
        for (const name of Object.keys(query)) {
            const val = query[name];
            params.delete(name);
            if (val !== undefined && val !== null) {
                if (val instanceof Array) {
                    for (const item of val) {
                        params.append(name, item);
                    }
                } else {
                    params.set(name, val);
                }
            }
        }
        const pathname = path;
        const urlQuery = params.toString();
        if (urlQuery !== '') {
            path = `${path}?${urlQuery}`;
        }
        options = options || {};
        if (options.skipIfUnchanged && pathname === this.history.location.pathname
            && sameParams(params, new URLSearchParams(this.history.location.search))) {
            return;
        }
        if (options.event && (options.event.metaKey || options.event.ctrlKey || options.event.button === 1)) {
            window.open(path, '_blank');
        } else {
            if (options.replace) {
                this.history.replace(path);
            } else {
                this.history.push(path);
            }
        }
    }
}

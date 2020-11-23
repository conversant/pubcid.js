import log from './log';
import {COOKIE, LOCAL_STORAGE} from './constants';
import {delCookie, getCookie, setCookie} from './cookieUtils';

const EXP_SUFFIX = '_exp';

/**
 * Check to see if localStorage is available.
 * @param {string} type localStorage or sessionStorage
 * @returns {boolean} True if the given storage type is supported by the browser
 */
export function isStorageSupported(type = 'localStorage') {
    let storage = {};

    try {
        const storage = window[type];
        const x = '__' + type + '_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}

/**
 * Clear all local storage
 */
export function clearStorage() {
    try {
        localStorage.clear();
    }
    catch(e) {
        log.debug(e);
    }
}

/**
 * Set an item in the storage with expiry time.
 * @param {string} key Key of the item to be stored
 * @param {string} val Value of the item to be stored
 * @param {number} expires Expiry time in minutes
 */

export function setStorageItem(key, val, expires) {
    try {
        if (expires !== undefined && expires != null) {
            const expStr = (new Date(Date.now() + (expires * 60 * 1000))).toUTCString();
            //const valStr = (typeof val === 'object') ? JSON.stringify(val) : val;
            localStorage.setItem(key + EXP_SUFFIX, expStr);
        }

        //localStorage.setItem(key, encodeURIComponent(val));
        localStorage.setItem(key, val);
    }
    catch(e) {
        log.debug(e);
    }
}

/**
 * Retrieve an item from storage if it exists and hasn't expired.
 * @param {string} key Key of the item.
 * @returns {string|null} Value of the item.
 */
export function getStorageItem(key) {
    let val = null;

    try {
        const expVal = localStorage.getItem(key + EXP_SUFFIX);

        if (!expVal) {
            // If there is no expiry time, then just return the item
            val = localStorage.getItem(key);
        }
        else {
            // Only return the item if it hasn't expired yet.
            // Otherwise delete the item.
            const expDate = new Date(expVal);
            const isValid = (expDate.getTime() - Date.now()) > 0;
            if (isValid) {
                val = localStorage.getItem(key);
            }
            else {
                removeStorageItem(key);
            }
        }
    }
    catch(e) {
        log.debug(e);
    }

    return val;
}

/**
 * Remove an item from storage
 * @param {string} key Key of the item to be removed
 */
export function removeStorageItem(key) {
    try {
        localStorage.removeItem(key + EXP_SUFFIX);
        localStorage.removeItem(key);
    }
    catch(e) {
        log.debug(e);
    }
}

/**
 * Read a value by checking cookies first and then local storage.
 * @param {string} type Storage type
 * @param {string} name Name of the item
 * @returns {string|null} a string if item exists
 */
export function readValue(type, name) {
    let value;

    if (type === COOKIE) {
        value = getCookie(name);
    } else if (type === LOCAL_STORAGE) {
        value = getStorageItem(name);
    }

    if (value === 'undefined' || value === 'null')
        return null;

    return value;
}

/**
 * Write a value to cookies or local storage
 * @param {string} type Storage type
 * @param {string} name Name of the item
 * @param {string} value Value to be stored
 * @param {number} expInterval Expiry time in minutes
 * @param {string} domain Cookie cookieDomain
 */
export function writeValue(type, name, value, expInterval, domain) {
    if (name && value) {
        if (type === COOKIE) {
            setCookie(name, value, expInterval, domain, '/', 'Lax');
        } else if (type === LOCAL_STORAGE) {
            setStorageItem(name, value, expInterval);
        }
    }
}

/**
 * Delete value from cookies or local storage
 * @param {string} type Storage type
 * @param {string} name Name of the item
 * @param {string} domain Cookie cookieDomain
 */
export function deleteValue(type, name, domain) {
    if (name) {
        if (type === COOKIE) {
            delCookie(name, domain, '/', 'Lax');
        } else if (type === LOCAL_STORAGE) {
            removeStorageItem(name);
        }
    }
}

/**
 * Find the top most domain that a cookie can be stored.
 * www.example.com => example.com
 * news.example.co.za => example.co.za
 *
 * @param {string} hostname Usually document.location.hostname
 * @returns {string} domain name
 */
export function extractDomain(hostname) {
    const value = '' + Math.floor(Math.random()*10000);
    const cookieName = `__dmtester_${value}`;
    const sameSite = 'Lax';  // Make firefox happy
    const parts = hostname.split('.');
    let lastDomain;

    // Start with writing a test cookie in the full domain.  If successful,
    // move on to the shorter domain until test cookie no longer works.
    // The last domain prior to the failure is the base domain.
    // For example:
    // Loop 0: www.example.com  success.  continue.
    // Loop 1: example.com      success.  continue.
    // Loop 2: com              failed.  stop.
    //
    // This is a alternative to a full suffix list library such as psl.
    // The upside is a much smaller footprint.  The downsides are additional cycles,
    // and warning messages on some browsers such as firefox due to failed tests.

    for (let i = 0, len = parts.length; i < len; ++i) {
        // Construct the domain name for this iteration
        const currDomain = parts.slice(i).join('.');
        // Set a test cookie that expires in 1 minute, which should be plenty of time
        setCookie(cookieName, value, 1, currDomain, '/', sameSite);
        // Attempt to read back the value that was just stored
        const cookieValue = getCookie(cookieName);

        if (cookieValue) {
            // Clean up first so the test cookies aren't left around
            delCookie(cookieName, currDomain, '/', sameSite);

            if (cookieValue === value) {
                // Test is successful, save the domain name, and move on to the next
                // shorter domain.
                lastDomain = currDomain;
            }
            else {
                // Unexpected result. Just return undefined.
                lastDomain = undefined;
                break;
            }
        }
        else {
            // Cookie failed.  Meaning the last saved domain is the top most
            // domain that a cookie can be written to.
            break;
        }
    }

    return lastDomain;
}

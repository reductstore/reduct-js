/*
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Copyright 2024 ReductStore
// This Source Code Form is subject to the terms of the Mozilla Public
//    License, v. 2.0. If a copy of the MPL was not distributed with this
//    file, You can obtain one at https://mozilla.org/MPL/2.0/.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct DiagnosticsError {
    pub count: u64,
    pub last_message: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Default)]
pub struct DiagnosticsItem {
    pub ok: u64,
    pub errored: u64,
    pub errors: HashMap<i16, DiagnosticsError>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Default)]
pub struct Diagnostics {
    pub hourly: DiagnosticsItem,
}

 */

class DiagnosticsErrorOriginal {
    count = 0;
    last_message = "";
}


/**
 * Diagnostics error
 */
export class DiagnosticsError {
    /**
     * Number of errors
     */
    readonly count: number = 0;

    /**
     * Last error message
     */
    readonly lastMessage: string = "";

    static parse(data: DiagnosticsErrorOriginal): DiagnosticsError {
        return {
            count: data.count,
            lastMessage: data.last_message
        };
    }
}

class OrigianlDiagnosticsItem {
    ok = 0n;
    errored = 0n;
    errors: { [key: number]: DiagnosticsErrorOriginal } = {};
}

/**
 * Diagnostics item
 */
export class DiagnosticsItem {
    /**
     * Number of successful operations
     */
    readonly ok: bigint = 0n;

    /**
     * Number of failed operations
     */
    readonly errored: bigint = 0n;

    /**
     * Errors
     */
    readonly errors: { [key: number]: DiagnosticsError } = {};

    static parse(data: OrigianlDiagnosticsItem): DiagnosticsItem {
        return {
            ok: data.ok,
            errored: data.errored,
            errors: Object.fromEntries(Object.entries(data.errors).map(([key, value]) => [Number(key), DiagnosticsError.parse(value)]))
        };
    }
}

export class OriginalDiagnostics {
    hourly = new OrigianlDiagnosticsItem();

}

/**
 * Diagnostics
 */
export class Diagnostics {
    /**
     * Hourly diagnostics
     */
    readonly hourly: DiagnosticsItem = new DiagnosticsItem();

    static parse(data: OriginalDiagnostics): Diagnostics {
        return {
            hourly: DiagnosticsItem.parse(data.hourly)
        };
    }
}
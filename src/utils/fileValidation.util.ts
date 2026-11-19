import path = require("node:path");

export function validPDF(file: Express.Multer.File) : boolean{
    return path.extname(file.path) == '.pdf'
        && file.mimetype == 'application/pdf'
        && file.buffer && file.buffer.length > 0
        && file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

export function validImage(file: Express.Multer.File) : boolean {
    return path.extname(file.path) == '.pdf'
        && file.mimetype == 'application/pdf'
        && file.buffer && file.buffer.length > 0
        && file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

export function validPFP(file: Express.Multer.File) : boolean {
    return path.extname(file.path) == '.pdf'
        && file.mimetype == 'application/pdf'
        && file.buffer && file.buffer.length > 0
        && file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}
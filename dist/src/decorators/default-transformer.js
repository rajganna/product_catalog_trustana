"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsString = exports.AsBoolean = exports.AsNumber = exports.Default = void 0;
const class_transformer_1 = require("class-transformer");
const Default = (defaultValue, transform) => {
    return (0, class_transformer_1.Transform)(({ value }) => transform(value) || defaultValue);
};
exports.Default = Default;
const AsNumber = (defaultValue) => (0, exports.Default)(defaultValue, value => parseInt(value, 10));
exports.AsNumber = AsNumber;
const AsBoolean = (defaultValue) => (0, exports.Default)(defaultValue, value => {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        const lower = value.toLowerCase();
        return lower === 'true' || lower === '1' || lower === 'yes';
    }
    return Boolean(value);
});
exports.AsBoolean = AsBoolean;
const AsString = (defaultValue) => (0, exports.Default)(defaultValue, value => String(value || '').trim());
exports.AsString = AsString;
//# sourceMappingURL=default-transformer.js.map
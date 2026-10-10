/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-mixed-operators, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars, default-case, jsdoc/require-param*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
const $Object = $util.global.Object, $undefined = $util.global.undefined, $Error = $util.global.Error, $RangeError = $util.global.RangeError, $TypeError = $util.global.TypeError, $String = $util.global.String, $Boolean = $util.global.Boolean, $Array = $util.global.Array, $Number = $util.global.Number, $parseInt = $util.global.parseInt, $BigInt = $util.global.BigInt, $isFinite = $util.global.isFinite;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const listentogether = $root.listentogether = (() => {

    /**
     * Namespace listentogether.
     * @exports listentogether
     * @namespace
     */
    const listentogether = {};

    listentogether.Envelope = (function() {

        /**
         * Properties of an Envelope.
         * @typedef {Object} listentogether.Envelope.$Properties
         * @property {string|null} [type] Envelope type
         * @property {Uint8Array|null} [payload] Envelope payload
         * @property {boolean|null} [compressed] Envelope compressed
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of an Envelope.
         * @memberof listentogether
         * @interface IEnvelope
         * @augments listentogether.Envelope.$Properties
         * @deprecated Use listentogether.Envelope.$Properties instead.
         */

        /**
         * Shape of an Envelope.
         * @typedef {listentogether.Envelope.$Properties} listentogether.Envelope.$Shape
         */

        /**
         * Constructs a new Envelope.
         * @memberof listentogether
         * @classdesc Represents an Envelope.
         * @constructor
         * @param {listentogether.Envelope.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const Envelope = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * Envelope type.
         * @member {string} type
         * @memberof listentogether.Envelope
         * @instance
         */
        Envelope.prototype.type = "";

        /**
         * Envelope payload.
         * @member {Uint8Array} payload
         * @memberof listentogether.Envelope
         * @instance
         */
        Envelope.prototype.payload = $util.newBuffer([]);

        /**
         * Envelope compressed.
         * @member {boolean} compressed
         * @memberof listentogether.Envelope
         * @instance
         */
        Envelope.prototype.compressed = false;

        /**
         * Creates a new Envelope instance using the specified properties.
         * @function create
         * @memberof listentogether.Envelope
         * @static
         * @param {listentogether.Envelope.$Properties=} [properties] Properties to set
         * @returns {listentogether.Envelope} Envelope instance
         * @type {{
         *   (properties: listentogether.Envelope.$Shape): listentogether.Envelope & listentogether.Envelope.$Shape;
         *   (properties?: listentogether.Envelope.$Properties): listentogether.Envelope;
         * }}
         */
        Envelope.create = function(properties) {
            return new Envelope(properties);
        };

        /**
         * Encodes the specified Envelope message. Does not implicitly {@link listentogether.Envelope.verify|verify} messages.
         * @function encode
         * @memberof listentogether.Envelope
         * @static
         * @param {listentogether.Envelope.$Properties} message Envelope message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Envelope.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.type != null && $Object.hasOwnProperty.call(message, "type") && message.type !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.type);
            if (message.payload != null && $Object.hasOwnProperty.call(message, "payload") && message.payload.length)
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.payload);
            if (message.compressed != null && $Object.hasOwnProperty.call(message, "compressed") && message.compressed !== false)
                writer.uint32(/* id 3, wireType 0 =*/24).bool(message.compressed);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified Envelope message, length delimited. Does not implicitly {@link listentogether.Envelope.verify|verify} messages.
         * @function encodeDelimited
         * @memberof listentogether.Envelope
         * @static
         * @param {listentogether.Envelope.$Properties} message Envelope message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Envelope.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes an Envelope message from the specified reader or buffer.
         * @function decode
         * @memberof listentogether.Envelope
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {listentogether.Envelope & listentogether.Envelope.$Shape} Envelope
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Envelope.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.listentogether.Envelope();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.type = value;
                        else
                            delete message.type;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.bytes()).length)
                            message.payload = value;
                        else
                            delete message.payload;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.compressed = value;
                        else
                            delete message.compressed;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes an Envelope message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof listentogether.Envelope
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {listentogether.Envelope & listentogether.Envelope.$Shape} Envelope
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Envelope.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Envelope message.
         * @function verify
         * @memberof listentogether.Envelope
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Envelope.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.type != null && $Object.hasOwnProperty.call(message, "type"))
                if (!$util.isString(message.type))
                    return "type: string expected";
            if (message.payload != null && $Object.hasOwnProperty.call(message, "payload"))
                if (!(message.payload && typeof message.payload.length === "number" || $util.isString(message.payload)))
                    return "payload: buffer expected";
            if (message.compressed != null && $Object.hasOwnProperty.call(message, "compressed"))
                if (typeof message.compressed !== "boolean")
                    return "compressed: boolean expected";
            return null;
        };

        /**
         * Creates an Envelope message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof listentogether.Envelope
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {listentogether.Envelope} Envelope
         */
        Envelope.fromObject = function (object, _depth) {
            if (object instanceof $root.listentogether.Envelope)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".listentogether.Envelope: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.listentogether.Envelope();
            if (object.type != null)
                if (typeof object.type !== "string" || object.type.length)
                    message.type = $String(object.type);
            if (object.payload != null)
                if (object.payload.length)
                    if (typeof object.payload === "string")
                        $util.base64.decode(object.payload, message.payload = $util.newBuffer($util.base64.length(object.payload)), 0);
                    else if (object.payload.length >= 0)
                        message.payload = object.payload;
            if (object.compressed != null)
                if (object.compressed)
                    message.compressed = $Boolean(object.compressed);
            return message;
        };

        /**
         * Creates a plain object from an Envelope message. Also converts values to other types if specified.
         * @function toObject
         * @memberof listentogether.Envelope
         * @static
         * @param {listentogether.Envelope} message Envelope
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Envelope.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.type = "";
                if (options.bytes === $String)
                    object.payload = "";
                else {
                    object.payload = [];
                    if (options.bytes !== $Array)
                        object.payload = $util.newBuffer(object.payload);
                }
                object.compressed = false;
            }
            if (message.type != null && $Object.hasOwnProperty.call(message, "type"))
                object.type = message.type;
            if (message.payload != null && $Object.hasOwnProperty.call(message, "payload"))
                object.payload = options.bytes === $String ? $util.base64.encode(message.payload, 0, message.payload.length) : options.bytes === $Array ? $Array.prototype.slice.call(message.payload) : message.payload;
            if (message.compressed != null && $Object.hasOwnProperty.call(message, "compressed"))
                object.compressed = message.compressed;
            return object;
        };

        /**
         * Converts this Envelope to JSON.
         * @function toJSON
         * @memberof listentogether.Envelope
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Envelope.prototype.toJSON = function() {
            return Envelope.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for Envelope
         * @function getTypeUrl
         * @memberof listentogether.Envelope
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        Envelope.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/listentogether.Envelope";
        };

        return Envelope;
    })();

    listentogether.TrackInfo = (function() {

        /**
         * Properties of a TrackInfo.
         * @typedef {Object} listentogether.TrackInfo.$Properties
         * @property {string|null} [id] TrackInfo id
         * @property {string|null} [title] TrackInfo title
         * @property {string|null} [artist] TrackInfo artist
         * @property {string|null} [album] TrackInfo album
         * @property {number|Long|null} [duration] TrackInfo duration
         * @property {string|null} [thumbnail] TrackInfo thumbnail
         * @property {string|null} [suggestedBy] TrackInfo suggestedBy
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a TrackInfo.
         * @memberof listentogether
         * @interface ITrackInfo
         * @augments listentogether.TrackInfo.$Properties
         * @deprecated Use listentogether.TrackInfo.$Properties instead.
         */

        /**
         * Shape of a TrackInfo.
         * @typedef {listentogether.TrackInfo.$Properties} listentogether.TrackInfo.$Shape
         */

        /**
         * Constructs a new TrackInfo.
         * @memberof listentogether
         * @classdesc Represents a TrackInfo.
         * @constructor
         * @param {listentogether.TrackInfo.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const TrackInfo = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * TrackInfo id.
         * @member {string} id
         * @memberof listentogether.TrackInfo
         * @instance
         */
        TrackInfo.prototype.id = "";

        /**
         * TrackInfo title.
         * @member {string} title
         * @memberof listentogether.TrackInfo
         * @instance
         */
        TrackInfo.prototype.title = "";

        /**
         * TrackInfo artist.
         * @member {string} artist
         * @memberof listentogether.TrackInfo
         * @instance
         */
        TrackInfo.prototype.artist = "";

        /**
         * TrackInfo album.
         * @member {string} album
         * @memberof listentogether.TrackInfo
         * @instance
         */
        TrackInfo.prototype.album = "";

        /**
         * TrackInfo duration.
         * @member {number|Long} duration
         * @memberof listentogether.TrackInfo
         * @instance
         */
        TrackInfo.prototype.duration = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * TrackInfo thumbnail.
         * @member {string} thumbnail
         * @memberof listentogether.TrackInfo
         * @instance
         */
        TrackInfo.prototype.thumbnail = "";

        /**
         * TrackInfo suggestedBy.
         * @member {string} suggestedBy
         * @memberof listentogether.TrackInfo
         * @instance
         */
        TrackInfo.prototype.suggestedBy = "";

        /**
         * Creates a new TrackInfo instance using the specified properties.
         * @function create
         * @memberof listentogether.TrackInfo
         * @static
         * @param {listentogether.TrackInfo.$Properties=} [properties] Properties to set
         * @returns {listentogether.TrackInfo} TrackInfo instance
         * @type {{
         *   (properties: listentogether.TrackInfo.$Shape): listentogether.TrackInfo & listentogether.TrackInfo.$Shape;
         *   (properties?: listentogether.TrackInfo.$Properties): listentogether.TrackInfo;
         * }}
         */
        TrackInfo.create = function(properties) {
            return new TrackInfo(properties);
        };

        /**
         * Encodes the specified TrackInfo message. Does not implicitly {@link listentogether.TrackInfo.verify|verify} messages.
         * @function encode
         * @memberof listentogether.TrackInfo
         * @static
         * @param {listentogether.TrackInfo.$Properties} message TrackInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TrackInfo.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.id != null && $Object.hasOwnProperty.call(message, "id") && message.id !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.title != null && $Object.hasOwnProperty.call(message, "title") && message.title !== "")
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.title);
            if (message.artist != null && $Object.hasOwnProperty.call(message, "artist") && message.artist !== "")
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.artist);
            if (message.album != null && $Object.hasOwnProperty.call(message, "album") && message.album !== "")
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.album);
            if (message.duration != null && $Object.hasOwnProperty.call(message, "duration") && (typeof message.duration === "object" ? message.duration.low || message.duration.high : message.duration !== 0))
                writer.uint32(/* id 5, wireType 0 =*/40).int64(message.duration);
            if (message.thumbnail != null && $Object.hasOwnProperty.call(message, "thumbnail") && message.thumbnail !== "")
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.thumbnail);
            if (message.suggestedBy != null && $Object.hasOwnProperty.call(message, "suggestedBy") && message.suggestedBy !== "")
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.suggestedBy);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified TrackInfo message, length delimited. Does not implicitly {@link listentogether.TrackInfo.verify|verify} messages.
         * @function encodeDelimited
         * @memberof listentogether.TrackInfo
         * @static
         * @param {listentogether.TrackInfo.$Properties} message TrackInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TrackInfo.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a TrackInfo message from the specified reader or buffer.
         * @function decode
         * @memberof listentogether.TrackInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {listentogether.TrackInfo & listentogether.TrackInfo.$Shape} TrackInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TrackInfo.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.listentogether.TrackInfo();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.id = value;
                        else
                            delete message.id;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.title = value;
                        else
                            delete message.title;
                        continue;
                    }
                case 3: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.artist = value;
                        else
                            delete message.artist;
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.album = value;
                        else
                            delete message.album;
                        continue;
                    }
                case 5: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.duration = value;
                        else
                            delete message.duration;
                        continue;
                    }
                case 6: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.thumbnail = value;
                        else
                            delete message.thumbnail;
                        continue;
                    }
                case 7: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.suggestedBy = value;
                        else
                            delete message.suggestedBy;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a TrackInfo message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof listentogether.TrackInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {listentogether.TrackInfo & listentogether.TrackInfo.$Shape} TrackInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TrackInfo.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a TrackInfo message.
         * @function verify
         * @memberof listentogether.TrackInfo
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        TrackInfo.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.id != null && $Object.hasOwnProperty.call(message, "id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.title != null && $Object.hasOwnProperty.call(message, "title"))
                if (!$util.isString(message.title))
                    return "title: string expected";
            if (message.artist != null && $Object.hasOwnProperty.call(message, "artist"))
                if (!$util.isString(message.artist))
                    return "artist: string expected";
            if (message.album != null && $Object.hasOwnProperty.call(message, "album"))
                if (!$util.isString(message.album))
                    return "album: string expected";
            if (message.duration != null && $Object.hasOwnProperty.call(message, "duration"))
                if (!$util.isInteger(message.duration) && !(message.duration && $util.isInteger(message.duration.low) && $util.isInteger(message.duration.high)))
                    return "duration: integer|Long expected";
            if (message.thumbnail != null && $Object.hasOwnProperty.call(message, "thumbnail"))
                if (!$util.isString(message.thumbnail))
                    return "thumbnail: string expected";
            if (message.suggestedBy != null && $Object.hasOwnProperty.call(message, "suggestedBy"))
                if (!$util.isString(message.suggestedBy))
                    return "suggestedBy: string expected";
            return null;
        };

        /**
         * Creates a TrackInfo message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof listentogether.TrackInfo
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {listentogether.TrackInfo} TrackInfo
         */
        TrackInfo.fromObject = function (object, _depth) {
            if (object instanceof $root.listentogether.TrackInfo)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".listentogether.TrackInfo: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.listentogether.TrackInfo();
            if (object.id != null)
                if (typeof object.id !== "string" || object.id.length)
                    message.id = $String(object.id);
            if (object.title != null)
                if (typeof object.title !== "string" || object.title.length)
                    message.title = $String(object.title);
            if (object.artist != null)
                if (typeof object.artist !== "string" || object.artist.length)
                    message.artist = $String(object.artist);
            if (object.album != null)
                if (typeof object.album !== "string" || object.album.length)
                    message.album = $String(object.album);
            if (object.duration != null)
                if (typeof object.duration === "object" ? object.duration.low || object.duration.high : $Number(object.duration) !== 0)
                    if ($util.Long)
                        message.duration = $util.Long.fromValue(object.duration, false);
                    else if (typeof object.duration === "string")
                        message.duration = $parseInt(object.duration, 10);
                    else if (typeof object.duration === "number")
                        message.duration = object.duration;
                    else if (typeof object.duration === "object")
                        message.duration = new $util.LongBits(object.duration.low >>> 0, object.duration.high >>> 0).toNumber();
            if (object.thumbnail != null)
                if (typeof object.thumbnail !== "string" || object.thumbnail.length)
                    message.thumbnail = $String(object.thumbnail);
            if (object.suggestedBy != null)
                if (typeof object.suggestedBy !== "string" || object.suggestedBy.length)
                    message.suggestedBy = $String(object.suggestedBy);
            return message;
        };

        /**
         * Creates a plain object from a TrackInfo message. Also converts values to other types if specified.
         * @function toObject
         * @memberof listentogether.TrackInfo
         * @static
         * @param {listentogether.TrackInfo} message TrackInfo
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        TrackInfo.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.id = "";
                object.title = "";
                object.artist = "";
                object.album = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.duration = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.duration = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                object.thumbnail = "";
                object.suggestedBy = "";
            }
            if (message.id != null && $Object.hasOwnProperty.call(message, "id"))
                object.id = message.id;
            if (message.title != null && $Object.hasOwnProperty.call(message, "title"))
                object.title = message.title;
            if (message.artist != null && $Object.hasOwnProperty.call(message, "artist"))
                object.artist = message.artist;
            if (message.album != null && $Object.hasOwnProperty.call(message, "album"))
                object.album = message.album;
            if (message.duration != null && $Object.hasOwnProperty.call(message, "duration"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.duration = typeof message.duration === "number" ? $BigInt(message.duration) : $util.Long.fromBits(message.duration.low >>> 0, message.duration.high >>> 0, false).toBigInt();
                else if (typeof message.duration === "number")
                    object.duration = options.longs === $String ? $String(message.duration) : message.duration;
                else
                    object.duration = options.longs === $String ? $util.Long.prototype.toString.call(message.duration) : options.longs === $Number ? new $util.LongBits(message.duration.low >>> 0, message.duration.high >>> 0).toNumber() : message.duration;
            if (message.thumbnail != null && $Object.hasOwnProperty.call(message, "thumbnail"))
                object.thumbnail = message.thumbnail;
            if (message.suggestedBy != null && $Object.hasOwnProperty.call(message, "suggestedBy"))
                object.suggestedBy = message.suggestedBy;
            return object;
        };

        /**
         * Converts this TrackInfo to JSON.
         * @function toJSON
         * @memberof listentogether.TrackInfo
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        TrackInfo.prototype.toJSON = function() {
            return TrackInfo.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for TrackInfo
         * @function getTypeUrl
         * @memberof listentogether.TrackInfo
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        TrackInfo.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/listentogether.TrackInfo";
        };

        return TrackInfo;
    })();

    listentogether.RoomState = (function() {

        /**
         * Properties of a RoomState.
         * @typedef {Object} listentogether.RoomState.$Properties
         * @property {string|null} [roomCode] RoomState roomCode
         * @property {string|null} [hostId] RoomState hostId
         * @property {listentogether.TrackInfo.$Properties|null} [currentTrack] RoomState currentTrack
         * @property {boolean|null} [isPlaying] RoomState isPlaying
         * @property {number|Long|null} [position] RoomState position
         * @property {number|Long|null} [lastUpdate] RoomState lastUpdate
         * @property {number|null} [volume] RoomState volume
         * @property {number|Long|null} [revision] RoomState revision
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a RoomState.
         * @memberof listentogether
         * @interface IRoomState
         * @augments listentogether.RoomState.$Properties
         * @deprecated Use listentogether.RoomState.$Properties instead.
         */

        /**
         * Shape of a RoomState.
         * @typedef {listentogether.RoomState.$Properties} listentogether.RoomState.$Shape
         */

        /**
         * Constructs a new RoomState.
         * @memberof listentogether
         * @classdesc Represents a RoomState.
         * @constructor
         * @param {listentogether.RoomState.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const RoomState = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * RoomState roomCode.
         * @member {string} roomCode
         * @memberof listentogether.RoomState
         * @instance
         */
        RoomState.prototype.roomCode = "";

        /**
         * RoomState hostId.
         * @member {string} hostId
         * @memberof listentogether.RoomState
         * @instance
         */
        RoomState.prototype.hostId = "";

        /**
         * RoomState currentTrack.
         * @member {listentogether.TrackInfo.$Properties|null|undefined} currentTrack
         * @memberof listentogether.RoomState
         * @instance
         */
        RoomState.prototype.currentTrack = null;

        /**
         * RoomState isPlaying.
         * @member {boolean} isPlaying
         * @memberof listentogether.RoomState
         * @instance
         */
        RoomState.prototype.isPlaying = false;

        /**
         * RoomState position.
         * @member {number|Long} position
         * @memberof listentogether.RoomState
         * @instance
         */
        RoomState.prototype.position = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * RoomState lastUpdate.
         * @member {number|Long} lastUpdate
         * @memberof listentogether.RoomState
         * @instance
         */
        RoomState.prototype.lastUpdate = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * RoomState volume.
         * @member {number} volume
         * @memberof listentogether.RoomState
         * @instance
         */
        RoomState.prototype.volume = 0;

        /**
         * RoomState revision.
         * @member {number|Long} revision
         * @memberof listentogether.RoomState
         * @instance
         */
        RoomState.prototype.revision = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Creates a new RoomState instance using the specified properties.
         * @function create
         * @memberof listentogether.RoomState
         * @static
         * @param {listentogether.RoomState.$Properties=} [properties] Properties to set
         * @returns {listentogether.RoomState} RoomState instance
         * @type {{
         *   (properties: listentogether.RoomState.$Shape): listentogether.RoomState & listentogether.RoomState.$Shape;
         *   (properties?: listentogether.RoomState.$Properties): listentogether.RoomState;
         * }}
         */
        RoomState.create = function(properties) {
            return new RoomState(properties);
        };

        /**
         * Encodes the specified RoomState message. Does not implicitly {@link listentogether.RoomState.verify|verify} messages.
         * @function encode
         * @memberof listentogether.RoomState
         * @static
         * @param {listentogether.RoomState.$Properties} message RoomState message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RoomState.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.roomCode != null && $Object.hasOwnProperty.call(message, "roomCode") && message.roomCode !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.roomCode);
            if (message.hostId != null && $Object.hasOwnProperty.call(message, "hostId") && message.hostId !== "")
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.hostId);
            if (message.currentTrack != null && $Object.hasOwnProperty.call(message, "currentTrack"))
                $root.listentogether.TrackInfo.encode(message.currentTrack, writer.uint32(/* id 4, wireType 2 =*/34).fork(), _depth + 1).ldelim();
            if (message.isPlaying != null && $Object.hasOwnProperty.call(message, "isPlaying") && message.isPlaying !== false)
                writer.uint32(/* id 5, wireType 0 =*/40).bool(message.isPlaying);
            if (message.position != null && $Object.hasOwnProperty.call(message, "position") && (typeof message.position === "object" ? message.position.low || message.position.high : message.position !== 0))
                writer.uint32(/* id 6, wireType 0 =*/48).int64(message.position);
            if (message.lastUpdate != null && $Object.hasOwnProperty.call(message, "lastUpdate") && (typeof message.lastUpdate === "object" ? message.lastUpdate.low || message.lastUpdate.high : message.lastUpdate !== 0))
                writer.uint32(/* id 7, wireType 0 =*/56).int64(message.lastUpdate);
            if (message.volume != null && $Object.hasOwnProperty.call(message, "volume") && !$Object.is(message.volume, 0))
                writer.uint32(/* id 8, wireType 5 =*/69).float(message.volume);
            if (message.revision != null && $Object.hasOwnProperty.call(message, "revision") && (typeof message.revision === "object" ? message.revision.low || message.revision.high : message.revision !== 0))
                writer.uint32(/* id 10, wireType 0 =*/80).uint64(message.revision);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified RoomState message, length delimited. Does not implicitly {@link listentogether.RoomState.verify|verify} messages.
         * @function encodeDelimited
         * @memberof listentogether.RoomState
         * @static
         * @param {listentogether.RoomState.$Properties} message RoomState message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RoomState.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a RoomState message from the specified reader or buffer.
         * @function decode
         * @memberof listentogether.RoomState
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {listentogether.RoomState & listentogether.RoomState.$Shape} RoomState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RoomState.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.listentogether.RoomState();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.roomCode = value;
                        else
                            delete message.roomCode;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.hostId = value;
                        else
                            delete message.hostId;
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        message.currentTrack = $root.listentogether.TrackInfo.decode(reader, reader.uint32(), $undefined, _depth + 1, message.currentTrack);
                        continue;
                    }
                case 5: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.isPlaying = value;
                        else
                            delete message.isPlaying;
                        continue;
                    }
                case 6: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.position = value;
                        else
                            delete message.position;
                        continue;
                    }
                case 7: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.lastUpdate = value;
                        else
                            delete message.lastUpdate;
                        continue;
                    }
                case 8: {
                        if (wireType !== 5)
                            break;
                        if (!$Object.is(value = reader.float(), 0))
                            message.volume = value;
                        else
                            delete message.volume;
                        continue;
                    }
                case 10: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.revision = value;
                        else
                            delete message.revision;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a RoomState message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof listentogether.RoomState
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {listentogether.RoomState & listentogether.RoomState.$Shape} RoomState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RoomState.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RoomState message.
         * @function verify
         * @memberof listentogether.RoomState
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RoomState.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.roomCode != null && $Object.hasOwnProperty.call(message, "roomCode"))
                if (!$util.isString(message.roomCode))
                    return "roomCode: string expected";
            if (message.hostId != null && $Object.hasOwnProperty.call(message, "hostId"))
                if (!$util.isString(message.hostId))
                    return "hostId: string expected";
            if (message.currentTrack != null && $Object.hasOwnProperty.call(message, "currentTrack")) {
                let error = $root.listentogether.TrackInfo.verify(message.currentTrack, _depth + 1);
                if (error)
                    return "currentTrack." + error;
            }
            if (message.isPlaying != null && $Object.hasOwnProperty.call(message, "isPlaying"))
                if (typeof message.isPlaying !== "boolean")
                    return "isPlaying: boolean expected";
            if (message.position != null && $Object.hasOwnProperty.call(message, "position"))
                if (!$util.isInteger(message.position) && !(message.position && $util.isInteger(message.position.low) && $util.isInteger(message.position.high)))
                    return "position: integer|Long expected";
            if (message.lastUpdate != null && $Object.hasOwnProperty.call(message, "lastUpdate"))
                if (!$util.isInteger(message.lastUpdate) && !(message.lastUpdate && $util.isInteger(message.lastUpdate.low) && $util.isInteger(message.lastUpdate.high)))
                    return "lastUpdate: integer|Long expected";
            if (message.volume != null && $Object.hasOwnProperty.call(message, "volume"))
                if (typeof message.volume !== "number")
                    return "volume: number expected";
            if (message.revision != null && $Object.hasOwnProperty.call(message, "revision"))
                if (!$util.isInteger(message.revision) && !(message.revision && $util.isInteger(message.revision.low) && $util.isInteger(message.revision.high)))
                    return "revision: integer|Long expected";
            return null;
        };

        /**
         * Creates a RoomState message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof listentogether.RoomState
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {listentogether.RoomState} RoomState
         */
        RoomState.fromObject = function (object, _depth) {
            if (object instanceof $root.listentogether.RoomState)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".listentogether.RoomState: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.listentogether.RoomState();
            if (object.roomCode != null)
                if (typeof object.roomCode !== "string" || object.roomCode.length)
                    message.roomCode = $String(object.roomCode);
            if (object.hostId != null)
                if (typeof object.hostId !== "string" || object.hostId.length)
                    message.hostId = $String(object.hostId);
            if (object.currentTrack != null) {
                if (!$util.isObject(object.currentTrack))
                    throw $TypeError(".listentogether.RoomState.currentTrack: object expected");
                message.currentTrack = $root.listentogether.TrackInfo.fromObject(object.currentTrack, _depth + 1);
            }
            if (object.isPlaying != null)
                if (object.isPlaying)
                    message.isPlaying = $Boolean(object.isPlaying);
            if (object.position != null)
                if (typeof object.position === "object" ? object.position.low || object.position.high : $Number(object.position) !== 0)
                    if ($util.Long)
                        message.position = $util.Long.fromValue(object.position, false);
                    else if (typeof object.position === "string")
                        message.position = $parseInt(object.position, 10);
                    else if (typeof object.position === "number")
                        message.position = object.position;
                    else if (typeof object.position === "object")
                        message.position = new $util.LongBits(object.position.low >>> 0, object.position.high >>> 0).toNumber();
            if (object.lastUpdate != null)
                if (typeof object.lastUpdate === "object" ? object.lastUpdate.low || object.lastUpdate.high : $Number(object.lastUpdate) !== 0)
                    if ($util.Long)
                        message.lastUpdate = $util.Long.fromValue(object.lastUpdate, false);
                    else if (typeof object.lastUpdate === "string")
                        message.lastUpdate = $parseInt(object.lastUpdate, 10);
                    else if (typeof object.lastUpdate === "number")
                        message.lastUpdate = object.lastUpdate;
                    else if (typeof object.lastUpdate === "object")
                        message.lastUpdate = new $util.LongBits(object.lastUpdate.low >>> 0, object.lastUpdate.high >>> 0).toNumber();
            if (object.volume != null)
                if (!$Object.is($Number(object.volume), 0))
                    message.volume = $Number(object.volume);
            if (object.revision != null)
                if (typeof object.revision === "object" ? object.revision.low || object.revision.high : $Number(object.revision) !== 0)
                    if ($util.Long)
                        message.revision = $util.Long.fromValue(object.revision, true);
                    else if (typeof object.revision === "string")
                        message.revision = $parseInt(object.revision, 10);
                    else if (typeof object.revision === "number")
                        message.revision = object.revision;
                    else if (typeof object.revision === "object")
                        message.revision = new $util.LongBits(object.revision.low >>> 0, object.revision.high >>> 0).toNumber(true);
            return message;
        };

        /**
         * Creates a plain object from a RoomState message. Also converts values to other types if specified.
         * @function toObject
         * @memberof listentogether.RoomState
         * @static
         * @param {listentogether.RoomState} message RoomState
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RoomState.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.roomCode = "";
                object.hostId = "";
                object.currentTrack = null;
                object.isPlaying = false;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.position = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.position = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.lastUpdate = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.lastUpdate = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                object.volume = 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.revision = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.revision = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
            }
            if (message.roomCode != null && $Object.hasOwnProperty.call(message, "roomCode"))
                object.roomCode = message.roomCode;
            if (message.hostId != null && $Object.hasOwnProperty.call(message, "hostId"))
                object.hostId = message.hostId;
            if (message.currentTrack != null && $Object.hasOwnProperty.call(message, "currentTrack"))
                object.currentTrack = $root.listentogether.TrackInfo.toObject(message.currentTrack, options, _depth + 1);
            if (message.isPlaying != null && $Object.hasOwnProperty.call(message, "isPlaying"))
                object.isPlaying = message.isPlaying;
            if (message.position != null && $Object.hasOwnProperty.call(message, "position"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.position = typeof message.position === "number" ? $BigInt(message.position) : $util.Long.fromBits(message.position.low >>> 0, message.position.high >>> 0, false).toBigInt();
                else if (typeof message.position === "number")
                    object.position = options.longs === $String ? $String(message.position) : message.position;
                else
                    object.position = options.longs === $String ? $util.Long.prototype.toString.call(message.position) : options.longs === $Number ? new $util.LongBits(message.position.low >>> 0, message.position.high >>> 0).toNumber() : message.position;
            if (message.lastUpdate != null && $Object.hasOwnProperty.call(message, "lastUpdate"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.lastUpdate = typeof message.lastUpdate === "number" ? $BigInt(message.lastUpdate) : $util.Long.fromBits(message.lastUpdate.low >>> 0, message.lastUpdate.high >>> 0, false).toBigInt();
                else if (typeof message.lastUpdate === "number")
                    object.lastUpdate = options.longs === $String ? $String(message.lastUpdate) : message.lastUpdate;
                else
                    object.lastUpdate = options.longs === $String ? $util.Long.prototype.toString.call(message.lastUpdate) : options.longs === $Number ? new $util.LongBits(message.lastUpdate.low >>> 0, message.lastUpdate.high >>> 0).toNumber() : message.lastUpdate;
            if (message.volume != null && $Object.hasOwnProperty.call(message, "volume"))
                object.volume = options.json && !$isFinite(message.volume) ? $String(message.volume) : message.volume;
            if (message.revision != null && $Object.hasOwnProperty.call(message, "revision"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.revision = typeof message.revision === "number" ? $BigInt(message.revision) : $util.Long.fromBits(message.revision.low >>> 0, message.revision.high >>> 0, true).toBigInt();
                else if (typeof message.revision === "number")
                    object.revision = options.longs === $String ? $String(message.revision) : message.revision;
                else
                    object.revision = options.longs === $String ? $util.Long.prototype.toString.call(message.revision) : options.longs === $Number ? new $util.LongBits(message.revision.low >>> 0, message.revision.high >>> 0).toNumber(true) : message.revision;
            return object;
        };

        /**
         * Converts this RoomState to JSON.
         * @function toJSON
         * @memberof listentogether.RoomState
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RoomState.prototype.toJSON = function() {
            return RoomState.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for RoomState
         * @function getTypeUrl
         * @memberof listentogether.RoomState
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        RoomState.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/listentogether.RoomState";
        };

        return RoomState;
    })();

    listentogether.ClientCapabilities = (function() {

        /**
         * Properties of a ClientCapabilities.
         * @typedef {Object} listentogether.ClientCapabilities.$Properties
         * @property {boolean|null} [supportsProtobuf] ClientCapabilities supportsProtobuf
         * @property {boolean|null} [supportsCompression] ClientCapabilities supportsCompression
         * @property {string|null} [clientVersion] ClientCapabilities clientVersion
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a ClientCapabilities.
         * @memberof listentogether
         * @interface IClientCapabilities
         * @augments listentogether.ClientCapabilities.$Properties
         * @deprecated Use listentogether.ClientCapabilities.$Properties instead.
         */

        /**
         * Shape of a ClientCapabilities.
         * @typedef {listentogether.ClientCapabilities.$Properties} listentogether.ClientCapabilities.$Shape
         */

        /**
         * Constructs a new ClientCapabilities.
         * @memberof listentogether
         * @classdesc Represents a ClientCapabilities.
         * @constructor
         * @param {listentogether.ClientCapabilities.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const ClientCapabilities = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * ClientCapabilities supportsProtobuf.
         * @member {boolean} supportsProtobuf
         * @memberof listentogether.ClientCapabilities
         * @instance
         */
        ClientCapabilities.prototype.supportsProtobuf = false;

        /**
         * ClientCapabilities supportsCompression.
         * @member {boolean} supportsCompression
         * @memberof listentogether.ClientCapabilities
         * @instance
         */
        ClientCapabilities.prototype.supportsCompression = false;

        /**
         * ClientCapabilities clientVersion.
         * @member {string} clientVersion
         * @memberof listentogether.ClientCapabilities
         * @instance
         */
        ClientCapabilities.prototype.clientVersion = "";

        /**
         * Creates a new ClientCapabilities instance using the specified properties.
         * @function create
         * @memberof listentogether.ClientCapabilities
         * @static
         * @param {listentogether.ClientCapabilities.$Properties=} [properties] Properties to set
         * @returns {listentogether.ClientCapabilities} ClientCapabilities instance
         * @type {{
         *   (properties: listentogether.ClientCapabilities.$Shape): listentogether.ClientCapabilities & listentogether.ClientCapabilities.$Shape;
         *   (properties?: listentogether.ClientCapabilities.$Properties): listentogether.ClientCapabilities;
         * }}
         */
        ClientCapabilities.create = function(properties) {
            return new ClientCapabilities(properties);
        };

        /**
         * Encodes the specified ClientCapabilities message. Does not implicitly {@link listentogether.ClientCapabilities.verify|verify} messages.
         * @function encode
         * @memberof listentogether.ClientCapabilities
         * @static
         * @param {listentogether.ClientCapabilities.$Properties} message ClientCapabilities message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ClientCapabilities.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.supportsProtobuf != null && $Object.hasOwnProperty.call(message, "supportsProtobuf") && message.supportsProtobuf !== false)
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.supportsProtobuf);
            if (message.supportsCompression != null && $Object.hasOwnProperty.call(message, "supportsCompression") && message.supportsCompression !== false)
                writer.uint32(/* id 2, wireType 0 =*/16).bool(message.supportsCompression);
            if (message.clientVersion != null && $Object.hasOwnProperty.call(message, "clientVersion") && message.clientVersion !== "")
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.clientVersion);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified ClientCapabilities message, length delimited. Does not implicitly {@link listentogether.ClientCapabilities.verify|verify} messages.
         * @function encodeDelimited
         * @memberof listentogether.ClientCapabilities
         * @static
         * @param {listentogether.ClientCapabilities.$Properties} message ClientCapabilities message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ClientCapabilities.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a ClientCapabilities message from the specified reader or buffer.
         * @function decode
         * @memberof listentogether.ClientCapabilities
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {listentogether.ClientCapabilities & listentogether.ClientCapabilities.$Shape} ClientCapabilities
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ClientCapabilities.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.listentogether.ClientCapabilities();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.supportsProtobuf = value;
                        else
                            delete message.supportsProtobuf;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.supportsCompression = value;
                        else
                            delete message.supportsCompression;
                        continue;
                    }
                case 3: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.clientVersion = value;
                        else
                            delete message.clientVersion;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a ClientCapabilities message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof listentogether.ClientCapabilities
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {listentogether.ClientCapabilities & listentogether.ClientCapabilities.$Shape} ClientCapabilities
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ClientCapabilities.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ClientCapabilities message.
         * @function verify
         * @memberof listentogether.ClientCapabilities
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ClientCapabilities.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.supportsProtobuf != null && $Object.hasOwnProperty.call(message, "supportsProtobuf"))
                if (typeof message.supportsProtobuf !== "boolean")
                    return "supportsProtobuf: boolean expected";
            if (message.supportsCompression != null && $Object.hasOwnProperty.call(message, "supportsCompression"))
                if (typeof message.supportsCompression !== "boolean")
                    return "supportsCompression: boolean expected";
            if (message.clientVersion != null && $Object.hasOwnProperty.call(message, "clientVersion"))
                if (!$util.isString(message.clientVersion))
                    return "clientVersion: string expected";
            return null;
        };

        /**
         * Creates a ClientCapabilities message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof listentogether.ClientCapabilities
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {listentogether.ClientCapabilities} ClientCapabilities
         */
        ClientCapabilities.fromObject = function (object, _depth) {
            if (object instanceof $root.listentogether.ClientCapabilities)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".listentogether.ClientCapabilities: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.listentogether.ClientCapabilities();
            if (object.supportsProtobuf != null)
                if (object.supportsProtobuf)
                    message.supportsProtobuf = $Boolean(object.supportsProtobuf);
            if (object.supportsCompression != null)
                if (object.supportsCompression)
                    message.supportsCompression = $Boolean(object.supportsCompression);
            if (object.clientVersion != null)
                if (typeof object.clientVersion !== "string" || object.clientVersion.length)
                    message.clientVersion = $String(object.clientVersion);
            return message;
        };

        /**
         * Creates a plain object from a ClientCapabilities message. Also converts values to other types if specified.
         * @function toObject
         * @memberof listentogether.ClientCapabilities
         * @static
         * @param {listentogether.ClientCapabilities} message ClientCapabilities
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ClientCapabilities.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.supportsProtobuf = false;
                object.supportsCompression = false;
                object.clientVersion = "";
            }
            if (message.supportsProtobuf != null && $Object.hasOwnProperty.call(message, "supportsProtobuf"))
                object.supportsProtobuf = message.supportsProtobuf;
            if (message.supportsCompression != null && $Object.hasOwnProperty.call(message, "supportsCompression"))
                object.supportsCompression = message.supportsCompression;
            if (message.clientVersion != null && $Object.hasOwnProperty.call(message, "clientVersion"))
                object.clientVersion = message.clientVersion;
            return object;
        };

        /**
         * Converts this ClientCapabilities to JSON.
         * @function toJSON
         * @memberof listentogether.ClientCapabilities
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ClientCapabilities.prototype.toJSON = function() {
            return ClientCapabilities.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for ClientCapabilities
         * @function getTypeUrl
         * @memberof listentogether.ClientCapabilities
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        ClientCapabilities.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/listentogether.ClientCapabilities";
        };

        return ClientCapabilities;
    })();

    listentogether.JoinRoomPayload = (function() {

        /**
         * Properties of a JoinRoomPayload.
         * @typedef {Object} listentogether.JoinRoomPayload.$Properties
         * @property {string|null} [roomCode] JoinRoomPayload roomCode
         * @property {string|null} [username] JoinRoomPayload username
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a JoinRoomPayload.
         * @memberof listentogether
         * @interface IJoinRoomPayload
         * @augments listentogether.JoinRoomPayload.$Properties
         * @deprecated Use listentogether.JoinRoomPayload.$Properties instead.
         */

        /**
         * Shape of a JoinRoomPayload.
         * @typedef {listentogether.JoinRoomPayload.$Properties} listentogether.JoinRoomPayload.$Shape
         */

        /**
         * Constructs a new JoinRoomPayload.
         * @memberof listentogether
         * @classdesc Represents a JoinRoomPayload.
         * @constructor
         * @param {listentogether.JoinRoomPayload.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const JoinRoomPayload = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * JoinRoomPayload roomCode.
         * @member {string} roomCode
         * @memberof listentogether.JoinRoomPayload
         * @instance
         */
        JoinRoomPayload.prototype.roomCode = "";

        /**
         * JoinRoomPayload username.
         * @member {string} username
         * @memberof listentogether.JoinRoomPayload
         * @instance
         */
        JoinRoomPayload.prototype.username = "";

        /**
         * Creates a new JoinRoomPayload instance using the specified properties.
         * @function create
         * @memberof listentogether.JoinRoomPayload
         * @static
         * @param {listentogether.JoinRoomPayload.$Properties=} [properties] Properties to set
         * @returns {listentogether.JoinRoomPayload} JoinRoomPayload instance
         * @type {{
         *   (properties: listentogether.JoinRoomPayload.$Shape): listentogether.JoinRoomPayload & listentogether.JoinRoomPayload.$Shape;
         *   (properties?: listentogether.JoinRoomPayload.$Properties): listentogether.JoinRoomPayload;
         * }}
         */
        JoinRoomPayload.create = function(properties) {
            return new JoinRoomPayload(properties);
        };

        /**
         * Encodes the specified JoinRoomPayload message. Does not implicitly {@link listentogether.JoinRoomPayload.verify|verify} messages.
         * @function encode
         * @memberof listentogether.JoinRoomPayload
         * @static
         * @param {listentogether.JoinRoomPayload.$Properties} message JoinRoomPayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        JoinRoomPayload.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.roomCode != null && $Object.hasOwnProperty.call(message, "roomCode") && message.roomCode !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.roomCode);
            if (message.username != null && $Object.hasOwnProperty.call(message, "username") && message.username !== "")
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.username);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified JoinRoomPayload message, length delimited. Does not implicitly {@link listentogether.JoinRoomPayload.verify|verify} messages.
         * @function encodeDelimited
         * @memberof listentogether.JoinRoomPayload
         * @static
         * @param {listentogether.JoinRoomPayload.$Properties} message JoinRoomPayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        JoinRoomPayload.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a JoinRoomPayload message from the specified reader or buffer.
         * @function decode
         * @memberof listentogether.JoinRoomPayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {listentogether.JoinRoomPayload & listentogether.JoinRoomPayload.$Shape} JoinRoomPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        JoinRoomPayload.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.listentogether.JoinRoomPayload();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.roomCode = value;
                        else
                            delete message.roomCode;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.username = value;
                        else
                            delete message.username;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a JoinRoomPayload message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof listentogether.JoinRoomPayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {listentogether.JoinRoomPayload & listentogether.JoinRoomPayload.$Shape} JoinRoomPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        JoinRoomPayload.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a JoinRoomPayload message.
         * @function verify
         * @memberof listentogether.JoinRoomPayload
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        JoinRoomPayload.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.roomCode != null && $Object.hasOwnProperty.call(message, "roomCode"))
                if (!$util.isString(message.roomCode))
                    return "roomCode: string expected";
            if (message.username != null && $Object.hasOwnProperty.call(message, "username"))
                if (!$util.isString(message.username))
                    return "username: string expected";
            return null;
        };

        /**
         * Creates a JoinRoomPayload message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof listentogether.JoinRoomPayload
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {listentogether.JoinRoomPayload} JoinRoomPayload
         */
        JoinRoomPayload.fromObject = function (object, _depth) {
            if (object instanceof $root.listentogether.JoinRoomPayload)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".listentogether.JoinRoomPayload: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.listentogether.JoinRoomPayload();
            if (object.roomCode != null)
                if (typeof object.roomCode !== "string" || object.roomCode.length)
                    message.roomCode = $String(object.roomCode);
            if (object.username != null)
                if (typeof object.username !== "string" || object.username.length)
                    message.username = $String(object.username);
            return message;
        };

        /**
         * Creates a plain object from a JoinRoomPayload message. Also converts values to other types if specified.
         * @function toObject
         * @memberof listentogether.JoinRoomPayload
         * @static
         * @param {listentogether.JoinRoomPayload} message JoinRoomPayload
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        JoinRoomPayload.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.roomCode = "";
                object.username = "";
            }
            if (message.roomCode != null && $Object.hasOwnProperty.call(message, "roomCode"))
                object.roomCode = message.roomCode;
            if (message.username != null && $Object.hasOwnProperty.call(message, "username"))
                object.username = message.username;
            return object;
        };

        /**
         * Converts this JoinRoomPayload to JSON.
         * @function toJSON
         * @memberof listentogether.JoinRoomPayload
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        JoinRoomPayload.prototype.toJSON = function() {
            return JoinRoomPayload.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for JoinRoomPayload
         * @function getTypeUrl
         * @memberof listentogether.JoinRoomPayload
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        JoinRoomPayload.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/listentogether.JoinRoomPayload";
        };

        return JoinRoomPayload;
    })();

    listentogether.JoinApprovedPayload = (function() {

        /**
         * Properties of a JoinApprovedPayload.
         * @typedef {Object} listentogether.JoinApprovedPayload.$Properties
         * @property {string|null} [roomCode] JoinApprovedPayload roomCode
         * @property {string|null} [userId] JoinApprovedPayload userId
         * @property {string|null} [sessionToken] JoinApprovedPayload sessionToken
         * @property {listentogether.RoomState.$Properties|null} [state] JoinApprovedPayload state
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a JoinApprovedPayload.
         * @memberof listentogether
         * @interface IJoinApprovedPayload
         * @augments listentogether.JoinApprovedPayload.$Properties
         * @deprecated Use listentogether.JoinApprovedPayload.$Properties instead.
         */

        /**
         * Shape of a JoinApprovedPayload.
         * @typedef {listentogether.JoinApprovedPayload.$Properties} listentogether.JoinApprovedPayload.$Shape
         */

        /**
         * Constructs a new JoinApprovedPayload.
         * @memberof listentogether
         * @classdesc Represents a JoinApprovedPayload.
         * @constructor
         * @param {listentogether.JoinApprovedPayload.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const JoinApprovedPayload = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * JoinApprovedPayload roomCode.
         * @member {string} roomCode
         * @memberof listentogether.JoinApprovedPayload
         * @instance
         */
        JoinApprovedPayload.prototype.roomCode = "";

        /**
         * JoinApprovedPayload userId.
         * @member {string} userId
         * @memberof listentogether.JoinApprovedPayload
         * @instance
         */
        JoinApprovedPayload.prototype.userId = "";

        /**
         * JoinApprovedPayload sessionToken.
         * @member {string} sessionToken
         * @memberof listentogether.JoinApprovedPayload
         * @instance
         */
        JoinApprovedPayload.prototype.sessionToken = "";

        /**
         * JoinApprovedPayload state.
         * @member {listentogether.RoomState.$Properties|null|undefined} state
         * @memberof listentogether.JoinApprovedPayload
         * @instance
         */
        JoinApprovedPayload.prototype.state = null;

        /**
         * Creates a new JoinApprovedPayload instance using the specified properties.
         * @function create
         * @memberof listentogether.JoinApprovedPayload
         * @static
         * @param {listentogether.JoinApprovedPayload.$Properties=} [properties] Properties to set
         * @returns {listentogether.JoinApprovedPayload} JoinApprovedPayload instance
         * @type {{
         *   (properties: listentogether.JoinApprovedPayload.$Shape): listentogether.JoinApprovedPayload & listentogether.JoinApprovedPayload.$Shape;
         *   (properties?: listentogether.JoinApprovedPayload.$Properties): listentogether.JoinApprovedPayload;
         * }}
         */
        JoinApprovedPayload.create = function(properties) {
            return new JoinApprovedPayload(properties);
        };

        /**
         * Encodes the specified JoinApprovedPayload message. Does not implicitly {@link listentogether.JoinApprovedPayload.verify|verify} messages.
         * @function encode
         * @memberof listentogether.JoinApprovedPayload
         * @static
         * @param {listentogether.JoinApprovedPayload.$Properties} message JoinApprovedPayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        JoinApprovedPayload.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.roomCode != null && $Object.hasOwnProperty.call(message, "roomCode") && message.roomCode !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.roomCode);
            if (message.userId != null && $Object.hasOwnProperty.call(message, "userId") && message.userId !== "")
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.userId);
            if (message.sessionToken != null && $Object.hasOwnProperty.call(message, "sessionToken") && message.sessionToken !== "")
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.sessionToken);
            if (message.state != null && $Object.hasOwnProperty.call(message, "state"))
                $root.listentogether.RoomState.encode(message.state, writer.uint32(/* id 4, wireType 2 =*/34).fork(), _depth + 1).ldelim();
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified JoinApprovedPayload message, length delimited. Does not implicitly {@link listentogether.JoinApprovedPayload.verify|verify} messages.
         * @function encodeDelimited
         * @memberof listentogether.JoinApprovedPayload
         * @static
         * @param {listentogether.JoinApprovedPayload.$Properties} message JoinApprovedPayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        JoinApprovedPayload.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a JoinApprovedPayload message from the specified reader or buffer.
         * @function decode
         * @memberof listentogether.JoinApprovedPayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {listentogether.JoinApprovedPayload & listentogether.JoinApprovedPayload.$Shape} JoinApprovedPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        JoinApprovedPayload.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.listentogether.JoinApprovedPayload();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.roomCode = value;
                        else
                            delete message.roomCode;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.userId = value;
                        else
                            delete message.userId;
                        continue;
                    }
                case 3: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.sessionToken = value;
                        else
                            delete message.sessionToken;
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        message.state = $root.listentogether.RoomState.decode(reader, reader.uint32(), $undefined, _depth + 1, message.state);
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a JoinApprovedPayload message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof listentogether.JoinApprovedPayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {listentogether.JoinApprovedPayload & listentogether.JoinApprovedPayload.$Shape} JoinApprovedPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        JoinApprovedPayload.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a JoinApprovedPayload message.
         * @function verify
         * @memberof listentogether.JoinApprovedPayload
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        JoinApprovedPayload.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.roomCode != null && $Object.hasOwnProperty.call(message, "roomCode"))
                if (!$util.isString(message.roomCode))
                    return "roomCode: string expected";
            if (message.userId != null && $Object.hasOwnProperty.call(message, "userId"))
                if (!$util.isString(message.userId))
                    return "userId: string expected";
            if (message.sessionToken != null && $Object.hasOwnProperty.call(message, "sessionToken"))
                if (!$util.isString(message.sessionToken))
                    return "sessionToken: string expected";
            if (message.state != null && $Object.hasOwnProperty.call(message, "state")) {
                let error = $root.listentogether.RoomState.verify(message.state, _depth + 1);
                if (error)
                    return "state." + error;
            }
            return null;
        };

        /**
         * Creates a JoinApprovedPayload message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof listentogether.JoinApprovedPayload
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {listentogether.JoinApprovedPayload} JoinApprovedPayload
         */
        JoinApprovedPayload.fromObject = function (object, _depth) {
            if (object instanceof $root.listentogether.JoinApprovedPayload)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".listentogether.JoinApprovedPayload: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.listentogether.JoinApprovedPayload();
            if (object.roomCode != null)
                if (typeof object.roomCode !== "string" || object.roomCode.length)
                    message.roomCode = $String(object.roomCode);
            if (object.userId != null)
                if (typeof object.userId !== "string" || object.userId.length)
                    message.userId = $String(object.userId);
            if (object.sessionToken != null)
                if (typeof object.sessionToken !== "string" || object.sessionToken.length)
                    message.sessionToken = $String(object.sessionToken);
            if (object.state != null) {
                if (!$util.isObject(object.state))
                    throw $TypeError(".listentogether.JoinApprovedPayload.state: object expected");
                message.state = $root.listentogether.RoomState.fromObject(object.state, _depth + 1);
            }
            return message;
        };

        /**
         * Creates a plain object from a JoinApprovedPayload message. Also converts values to other types if specified.
         * @function toObject
         * @memberof listentogether.JoinApprovedPayload
         * @static
         * @param {listentogether.JoinApprovedPayload} message JoinApprovedPayload
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        JoinApprovedPayload.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.roomCode = "";
                object.userId = "";
                object.sessionToken = "";
                object.state = null;
            }
            if (message.roomCode != null && $Object.hasOwnProperty.call(message, "roomCode"))
                object.roomCode = message.roomCode;
            if (message.userId != null && $Object.hasOwnProperty.call(message, "userId"))
                object.userId = message.userId;
            if (message.sessionToken != null && $Object.hasOwnProperty.call(message, "sessionToken"))
                object.sessionToken = message.sessionToken;
            if (message.state != null && $Object.hasOwnProperty.call(message, "state"))
                object.state = $root.listentogether.RoomState.toObject(message.state, options, _depth + 1);
            return object;
        };

        /**
         * Converts this JoinApprovedPayload to JSON.
         * @function toJSON
         * @memberof listentogether.JoinApprovedPayload
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        JoinApprovedPayload.prototype.toJSON = function() {
            return JoinApprovedPayload.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for JoinApprovedPayload
         * @function getTypeUrl
         * @memberof listentogether.JoinApprovedPayload
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        JoinApprovedPayload.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/listentogether.JoinApprovedPayload";
        };

        return JoinApprovedPayload;
    })();

    listentogether.SyncStatePayload = (function() {

        /**
         * Properties of a SyncStatePayload.
         * @typedef {Object} listentogether.SyncStatePayload.$Properties
         * @property {listentogether.TrackInfo.$Properties|null} [currentTrack] SyncStatePayload currentTrack
         * @property {boolean|null} [isPlaying] SyncStatePayload isPlaying
         * @property {number|Long|null} [position] SyncStatePayload position
         * @property {number|Long|null} [lastUpdate] SyncStatePayload lastUpdate
         * @property {number|null} [volume] SyncStatePayload volume
         * @property {number|Long|null} [revision] SyncStatePayload revision
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a SyncStatePayload.
         * @memberof listentogether
         * @interface ISyncStatePayload
         * @augments listentogether.SyncStatePayload.$Properties
         * @deprecated Use listentogether.SyncStatePayload.$Properties instead.
         */

        /**
         * Shape of a SyncStatePayload.
         * @typedef {listentogether.SyncStatePayload.$Properties} listentogether.SyncStatePayload.$Shape
         */

        /**
         * Constructs a new SyncStatePayload.
         * @memberof listentogether
         * @classdesc Represents a SyncStatePayload.
         * @constructor
         * @param {listentogether.SyncStatePayload.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const SyncStatePayload = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * SyncStatePayload currentTrack.
         * @member {listentogether.TrackInfo.$Properties|null|undefined} currentTrack
         * @memberof listentogether.SyncStatePayload
         * @instance
         */
        SyncStatePayload.prototype.currentTrack = null;

        /**
         * SyncStatePayload isPlaying.
         * @member {boolean} isPlaying
         * @memberof listentogether.SyncStatePayload
         * @instance
         */
        SyncStatePayload.prototype.isPlaying = false;

        /**
         * SyncStatePayload position.
         * @member {number|Long} position
         * @memberof listentogether.SyncStatePayload
         * @instance
         */
        SyncStatePayload.prototype.position = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * SyncStatePayload lastUpdate.
         * @member {number|Long} lastUpdate
         * @memberof listentogether.SyncStatePayload
         * @instance
         */
        SyncStatePayload.prototype.lastUpdate = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * SyncStatePayload volume.
         * @member {number} volume
         * @memberof listentogether.SyncStatePayload
         * @instance
         */
        SyncStatePayload.prototype.volume = 0;

        /**
         * SyncStatePayload revision.
         * @member {number|Long} revision
         * @memberof listentogether.SyncStatePayload
         * @instance
         */
        SyncStatePayload.prototype.revision = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Creates a new SyncStatePayload instance using the specified properties.
         * @function create
         * @memberof listentogether.SyncStatePayload
         * @static
         * @param {listentogether.SyncStatePayload.$Properties=} [properties] Properties to set
         * @returns {listentogether.SyncStatePayload} SyncStatePayload instance
         * @type {{
         *   (properties: listentogether.SyncStatePayload.$Shape): listentogether.SyncStatePayload & listentogether.SyncStatePayload.$Shape;
         *   (properties?: listentogether.SyncStatePayload.$Properties): listentogether.SyncStatePayload;
         * }}
         */
        SyncStatePayload.create = function(properties) {
            return new SyncStatePayload(properties);
        };

        /**
         * Encodes the specified SyncStatePayload message. Does not implicitly {@link listentogether.SyncStatePayload.verify|verify} messages.
         * @function encode
         * @memberof listentogether.SyncStatePayload
         * @static
         * @param {listentogether.SyncStatePayload.$Properties} message SyncStatePayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SyncStatePayload.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.currentTrack != null && $Object.hasOwnProperty.call(message, "currentTrack"))
                $root.listentogether.TrackInfo.encode(message.currentTrack, writer.uint32(/* id 1, wireType 2 =*/10).fork(), _depth + 1).ldelim();
            if (message.isPlaying != null && $Object.hasOwnProperty.call(message, "isPlaying") && message.isPlaying !== false)
                writer.uint32(/* id 2, wireType 0 =*/16).bool(message.isPlaying);
            if (message.position != null && $Object.hasOwnProperty.call(message, "position") && (typeof message.position === "object" ? message.position.low || message.position.high : message.position !== 0))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.position);
            if (message.lastUpdate != null && $Object.hasOwnProperty.call(message, "lastUpdate") && (typeof message.lastUpdate === "object" ? message.lastUpdate.low || message.lastUpdate.high : message.lastUpdate !== 0))
                writer.uint32(/* id 4, wireType 0 =*/32).int64(message.lastUpdate);
            if (message.volume != null && $Object.hasOwnProperty.call(message, "volume") && !$Object.is(message.volume, 0))
                writer.uint32(/* id 6, wireType 5 =*/53).float(message.volume);
            if (message.revision != null && $Object.hasOwnProperty.call(message, "revision") && (typeof message.revision === "object" ? message.revision.low || message.revision.high : message.revision !== 0))
                writer.uint32(/* id 7, wireType 0 =*/56).uint64(message.revision);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified SyncStatePayload message, length delimited. Does not implicitly {@link listentogether.SyncStatePayload.verify|verify} messages.
         * @function encodeDelimited
         * @memberof listentogether.SyncStatePayload
         * @static
         * @param {listentogether.SyncStatePayload.$Properties} message SyncStatePayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SyncStatePayload.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a SyncStatePayload message from the specified reader or buffer.
         * @function decode
         * @memberof listentogether.SyncStatePayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {listentogether.SyncStatePayload & listentogether.SyncStatePayload.$Shape} SyncStatePayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SyncStatePayload.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.listentogether.SyncStatePayload();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        message.currentTrack = $root.listentogether.TrackInfo.decode(reader, reader.uint32(), $undefined, _depth + 1, message.currentTrack);
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.isPlaying = value;
                        else
                            delete message.isPlaying;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.position = value;
                        else
                            delete message.position;
                        continue;
                    }
                case 4: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.lastUpdate = value;
                        else
                            delete message.lastUpdate;
                        continue;
                    }
                case 6: {
                        if (wireType !== 5)
                            break;
                        if (!$Object.is(value = reader.float(), 0))
                            message.volume = value;
                        else
                            delete message.volume;
                        continue;
                    }
                case 7: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.revision = value;
                        else
                            delete message.revision;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a SyncStatePayload message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof listentogether.SyncStatePayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {listentogether.SyncStatePayload & listentogether.SyncStatePayload.$Shape} SyncStatePayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SyncStatePayload.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SyncStatePayload message.
         * @function verify
         * @memberof listentogether.SyncStatePayload
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SyncStatePayload.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.currentTrack != null && $Object.hasOwnProperty.call(message, "currentTrack")) {
                let error = $root.listentogether.TrackInfo.verify(message.currentTrack, _depth + 1);
                if (error)
                    return "currentTrack." + error;
            }
            if (message.isPlaying != null && $Object.hasOwnProperty.call(message, "isPlaying"))
                if (typeof message.isPlaying !== "boolean")
                    return "isPlaying: boolean expected";
            if (message.position != null && $Object.hasOwnProperty.call(message, "position"))
                if (!$util.isInteger(message.position) && !(message.position && $util.isInteger(message.position.low) && $util.isInteger(message.position.high)))
                    return "position: integer|Long expected";
            if (message.lastUpdate != null && $Object.hasOwnProperty.call(message, "lastUpdate"))
                if (!$util.isInteger(message.lastUpdate) && !(message.lastUpdate && $util.isInteger(message.lastUpdate.low) && $util.isInteger(message.lastUpdate.high)))
                    return "lastUpdate: integer|Long expected";
            if (message.volume != null && $Object.hasOwnProperty.call(message, "volume"))
                if (typeof message.volume !== "number")
                    return "volume: number expected";
            if (message.revision != null && $Object.hasOwnProperty.call(message, "revision"))
                if (!$util.isInteger(message.revision) && !(message.revision && $util.isInteger(message.revision.low) && $util.isInteger(message.revision.high)))
                    return "revision: integer|Long expected";
            return null;
        };

        /**
         * Creates a SyncStatePayload message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof listentogether.SyncStatePayload
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {listentogether.SyncStatePayload} SyncStatePayload
         */
        SyncStatePayload.fromObject = function (object, _depth) {
            if (object instanceof $root.listentogether.SyncStatePayload)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".listentogether.SyncStatePayload: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.listentogether.SyncStatePayload();
            if (object.currentTrack != null) {
                if (!$util.isObject(object.currentTrack))
                    throw $TypeError(".listentogether.SyncStatePayload.currentTrack: object expected");
                message.currentTrack = $root.listentogether.TrackInfo.fromObject(object.currentTrack, _depth + 1);
            }
            if (object.isPlaying != null)
                if (object.isPlaying)
                    message.isPlaying = $Boolean(object.isPlaying);
            if (object.position != null)
                if (typeof object.position === "object" ? object.position.low || object.position.high : $Number(object.position) !== 0)
                    if ($util.Long)
                        message.position = $util.Long.fromValue(object.position, false);
                    else if (typeof object.position === "string")
                        message.position = $parseInt(object.position, 10);
                    else if (typeof object.position === "number")
                        message.position = object.position;
                    else if (typeof object.position === "object")
                        message.position = new $util.LongBits(object.position.low >>> 0, object.position.high >>> 0).toNumber();
            if (object.lastUpdate != null)
                if (typeof object.lastUpdate === "object" ? object.lastUpdate.low || object.lastUpdate.high : $Number(object.lastUpdate) !== 0)
                    if ($util.Long)
                        message.lastUpdate = $util.Long.fromValue(object.lastUpdate, false);
                    else if (typeof object.lastUpdate === "string")
                        message.lastUpdate = $parseInt(object.lastUpdate, 10);
                    else if (typeof object.lastUpdate === "number")
                        message.lastUpdate = object.lastUpdate;
                    else if (typeof object.lastUpdate === "object")
                        message.lastUpdate = new $util.LongBits(object.lastUpdate.low >>> 0, object.lastUpdate.high >>> 0).toNumber();
            if (object.volume != null)
                if (!$Object.is($Number(object.volume), 0))
                    message.volume = $Number(object.volume);
            if (object.revision != null)
                if (typeof object.revision === "object" ? object.revision.low || object.revision.high : $Number(object.revision) !== 0)
                    if ($util.Long)
                        message.revision = $util.Long.fromValue(object.revision, true);
                    else if (typeof object.revision === "string")
                        message.revision = $parseInt(object.revision, 10);
                    else if (typeof object.revision === "number")
                        message.revision = object.revision;
                    else if (typeof object.revision === "object")
                        message.revision = new $util.LongBits(object.revision.low >>> 0, object.revision.high >>> 0).toNumber(true);
            return message;
        };

        /**
         * Creates a plain object from a SyncStatePayload message. Also converts values to other types if specified.
         * @function toObject
         * @memberof listentogether.SyncStatePayload
         * @static
         * @param {listentogether.SyncStatePayload} message SyncStatePayload
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SyncStatePayload.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.currentTrack = null;
                object.isPlaying = false;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.position = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.position = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.lastUpdate = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.lastUpdate = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                object.volume = 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.revision = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.revision = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
            }
            if (message.currentTrack != null && $Object.hasOwnProperty.call(message, "currentTrack"))
                object.currentTrack = $root.listentogether.TrackInfo.toObject(message.currentTrack, options, _depth + 1);
            if (message.isPlaying != null && $Object.hasOwnProperty.call(message, "isPlaying"))
                object.isPlaying = message.isPlaying;
            if (message.position != null && $Object.hasOwnProperty.call(message, "position"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.position = typeof message.position === "number" ? $BigInt(message.position) : $util.Long.fromBits(message.position.low >>> 0, message.position.high >>> 0, false).toBigInt();
                else if (typeof message.position === "number")
                    object.position = options.longs === $String ? $String(message.position) : message.position;
                else
                    object.position = options.longs === $String ? $util.Long.prototype.toString.call(message.position) : options.longs === $Number ? new $util.LongBits(message.position.low >>> 0, message.position.high >>> 0).toNumber() : message.position;
            if (message.lastUpdate != null && $Object.hasOwnProperty.call(message, "lastUpdate"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.lastUpdate = typeof message.lastUpdate === "number" ? $BigInt(message.lastUpdate) : $util.Long.fromBits(message.lastUpdate.low >>> 0, message.lastUpdate.high >>> 0, false).toBigInt();
                else if (typeof message.lastUpdate === "number")
                    object.lastUpdate = options.longs === $String ? $String(message.lastUpdate) : message.lastUpdate;
                else
                    object.lastUpdate = options.longs === $String ? $util.Long.prototype.toString.call(message.lastUpdate) : options.longs === $Number ? new $util.LongBits(message.lastUpdate.low >>> 0, message.lastUpdate.high >>> 0).toNumber() : message.lastUpdate;
            if (message.volume != null && $Object.hasOwnProperty.call(message, "volume"))
                object.volume = options.json && !$isFinite(message.volume) ? $String(message.volume) : message.volume;
            if (message.revision != null && $Object.hasOwnProperty.call(message, "revision"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.revision = typeof message.revision === "number" ? $BigInt(message.revision) : $util.Long.fromBits(message.revision.low >>> 0, message.revision.high >>> 0, true).toBigInt();
                else if (typeof message.revision === "number")
                    object.revision = options.longs === $String ? $String(message.revision) : message.revision;
                else
                    object.revision = options.longs === $String ? $util.Long.prototype.toString.call(message.revision) : options.longs === $Number ? new $util.LongBits(message.revision.low >>> 0, message.revision.high >>> 0).toNumber(true) : message.revision;
            return object;
        };

        /**
         * Converts this SyncStatePayload to JSON.
         * @function toJSON
         * @memberof listentogether.SyncStatePayload
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SyncStatePayload.prototype.toJSON = function() {
            return SyncStatePayload.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for SyncStatePayload
         * @function getTypeUrl
         * @memberof listentogether.SyncStatePayload
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        SyncStatePayload.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/listentogether.SyncStatePayload";
        };

        return SyncStatePayload;
    })();

    listentogether.PlaybackActionPayload = (function() {

        /**
         * Properties of a PlaybackActionPayload.
         * @typedef {Object} listentogether.PlaybackActionPayload.$Properties
         * @property {string|null} [action] PlaybackActionPayload action
         * @property {string|null} [trackId] PlaybackActionPayload trackId
         * @property {number|Long|null} [position] PlaybackActionPayload position
         * @property {listentogether.TrackInfo.$Properties|null} [trackInfo] PlaybackActionPayload trackInfo
         * @property {boolean|null} [insertNext] PlaybackActionPayload insertNext
         * @property {string|null} [queueTitle] PlaybackActionPayload queueTitle
         * @property {number|null} [volume] PlaybackActionPayload volume
         * @property {number|Long|null} [serverTime] PlaybackActionPayload serverTime
         * @property {number|Long|null} [revision] PlaybackActionPayload revision
         * @property {number|Long|null} [capturedAtServerTime] PlaybackActionPayload capturedAtServerTime
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a PlaybackActionPayload.
         * @memberof listentogether
         * @interface IPlaybackActionPayload
         * @augments listentogether.PlaybackActionPayload.$Properties
         * @deprecated Use listentogether.PlaybackActionPayload.$Properties instead.
         */

        /**
         * Shape of a PlaybackActionPayload.
         * @typedef {listentogether.PlaybackActionPayload.$Properties} listentogether.PlaybackActionPayload.$Shape
         */

        /**
         * Constructs a new PlaybackActionPayload.
         * @memberof listentogether
         * @classdesc Represents a PlaybackActionPayload.
         * @constructor
         * @param {listentogether.PlaybackActionPayload.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const PlaybackActionPayload = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * PlaybackActionPayload action.
         * @member {string} action
         * @memberof listentogether.PlaybackActionPayload
         * @instance
         */
        PlaybackActionPayload.prototype.action = "";

        /**
         * PlaybackActionPayload trackId.
         * @member {string} trackId
         * @memberof listentogether.PlaybackActionPayload
         * @instance
         */
        PlaybackActionPayload.prototype.trackId = "";

        /**
         * PlaybackActionPayload position.
         * @member {number|Long} position
         * @memberof listentogether.PlaybackActionPayload
         * @instance
         */
        PlaybackActionPayload.prototype.position = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * PlaybackActionPayload trackInfo.
         * @member {listentogether.TrackInfo.$Properties|null|undefined} trackInfo
         * @memberof listentogether.PlaybackActionPayload
         * @instance
         */
        PlaybackActionPayload.prototype.trackInfo = null;

        /**
         * PlaybackActionPayload insertNext.
         * @member {boolean} insertNext
         * @memberof listentogether.PlaybackActionPayload
         * @instance
         */
        PlaybackActionPayload.prototype.insertNext = false;

        /**
         * PlaybackActionPayload queueTitle.
         * @member {string} queueTitle
         * @memberof listentogether.PlaybackActionPayload
         * @instance
         */
        PlaybackActionPayload.prototype.queueTitle = "";

        /**
         * PlaybackActionPayload volume.
         * @member {number} volume
         * @memberof listentogether.PlaybackActionPayload
         * @instance
         */
        PlaybackActionPayload.prototype.volume = 0;

        /**
         * PlaybackActionPayload serverTime.
         * @member {number|Long} serverTime
         * @memberof listentogether.PlaybackActionPayload
         * @instance
         */
        PlaybackActionPayload.prototype.serverTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * PlaybackActionPayload revision.
         * @member {number|Long} revision
         * @memberof listentogether.PlaybackActionPayload
         * @instance
         */
        PlaybackActionPayload.prototype.revision = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * PlaybackActionPayload capturedAtServerTime.
         * @member {number|Long} capturedAtServerTime
         * @memberof listentogether.PlaybackActionPayload
         * @instance
         */
        PlaybackActionPayload.prototype.capturedAtServerTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new PlaybackActionPayload instance using the specified properties.
         * @function create
         * @memberof listentogether.PlaybackActionPayload
         * @static
         * @param {listentogether.PlaybackActionPayload.$Properties=} [properties] Properties to set
         * @returns {listentogether.PlaybackActionPayload} PlaybackActionPayload instance
         * @type {{
         *   (properties: listentogether.PlaybackActionPayload.$Shape): listentogether.PlaybackActionPayload & listentogether.PlaybackActionPayload.$Shape;
         *   (properties?: listentogether.PlaybackActionPayload.$Properties): listentogether.PlaybackActionPayload;
         * }}
         */
        PlaybackActionPayload.create = function(properties) {
            return new PlaybackActionPayload(properties);
        };

        /**
         * Encodes the specified PlaybackActionPayload message. Does not implicitly {@link listentogether.PlaybackActionPayload.verify|verify} messages.
         * @function encode
         * @memberof listentogether.PlaybackActionPayload
         * @static
         * @param {listentogether.PlaybackActionPayload.$Properties} message PlaybackActionPayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PlaybackActionPayload.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.action != null && $Object.hasOwnProperty.call(message, "action") && message.action !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.action);
            if (message.trackId != null && $Object.hasOwnProperty.call(message, "trackId") && message.trackId !== "")
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.trackId);
            if (message.position != null && $Object.hasOwnProperty.call(message, "position") && (typeof message.position === "object" ? message.position.low || message.position.high : message.position !== 0))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.position);
            if (message.trackInfo != null && $Object.hasOwnProperty.call(message, "trackInfo"))
                $root.listentogether.TrackInfo.encode(message.trackInfo, writer.uint32(/* id 4, wireType 2 =*/34).fork(), _depth + 1).ldelim();
            if (message.insertNext != null && $Object.hasOwnProperty.call(message, "insertNext") && message.insertNext !== false)
                writer.uint32(/* id 5, wireType 0 =*/40).bool(message.insertNext);
            if (message.queueTitle != null && $Object.hasOwnProperty.call(message, "queueTitle") && message.queueTitle !== "")
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.queueTitle);
            if (message.volume != null && $Object.hasOwnProperty.call(message, "volume") && !$Object.is(message.volume, 0))
                writer.uint32(/* id 8, wireType 5 =*/69).float(message.volume);
            if (message.serverTime != null && $Object.hasOwnProperty.call(message, "serverTime") && (typeof message.serverTime === "object" ? message.serverTime.low || message.serverTime.high : message.serverTime !== 0))
                writer.uint32(/* id 9, wireType 0 =*/72).int64(message.serverTime);
            if (message.revision != null && $Object.hasOwnProperty.call(message, "revision") && (typeof message.revision === "object" ? message.revision.low || message.revision.high : message.revision !== 0))
                writer.uint32(/* id 10, wireType 0 =*/80).uint64(message.revision);
            if (message.capturedAtServerTime != null && $Object.hasOwnProperty.call(message, "capturedAtServerTime") && (typeof message.capturedAtServerTime === "object" ? message.capturedAtServerTime.low || message.capturedAtServerTime.high : message.capturedAtServerTime !== 0))
                writer.uint32(/* id 11, wireType 0 =*/88).int64(message.capturedAtServerTime);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified PlaybackActionPayload message, length delimited. Does not implicitly {@link listentogether.PlaybackActionPayload.verify|verify} messages.
         * @function encodeDelimited
         * @memberof listentogether.PlaybackActionPayload
         * @static
         * @param {listentogether.PlaybackActionPayload.$Properties} message PlaybackActionPayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PlaybackActionPayload.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a PlaybackActionPayload message from the specified reader or buffer.
         * @function decode
         * @memberof listentogether.PlaybackActionPayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {listentogether.PlaybackActionPayload & listentogether.PlaybackActionPayload.$Shape} PlaybackActionPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PlaybackActionPayload.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.listentogether.PlaybackActionPayload();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.action = value;
                        else
                            delete message.action;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.trackId = value;
                        else
                            delete message.trackId;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.position = value;
                        else
                            delete message.position;
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        message.trackInfo = $root.listentogether.TrackInfo.decode(reader, reader.uint32(), $undefined, _depth + 1, message.trackInfo);
                        continue;
                    }
                case 5: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.insertNext = value;
                        else
                            delete message.insertNext;
                        continue;
                    }
                case 7: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.queueTitle = value;
                        else
                            delete message.queueTitle;
                        continue;
                    }
                case 8: {
                        if (wireType !== 5)
                            break;
                        if (!$Object.is(value = reader.float(), 0))
                            message.volume = value;
                        else
                            delete message.volume;
                        continue;
                    }
                case 9: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.serverTime = value;
                        else
                            delete message.serverTime;
                        continue;
                    }
                case 10: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.revision = value;
                        else
                            delete message.revision;
                        continue;
                    }
                case 11: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.capturedAtServerTime = value;
                        else
                            delete message.capturedAtServerTime;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a PlaybackActionPayload message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof listentogether.PlaybackActionPayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {listentogether.PlaybackActionPayload & listentogether.PlaybackActionPayload.$Shape} PlaybackActionPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PlaybackActionPayload.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PlaybackActionPayload message.
         * @function verify
         * @memberof listentogether.PlaybackActionPayload
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PlaybackActionPayload.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.action != null && $Object.hasOwnProperty.call(message, "action"))
                if (!$util.isString(message.action))
                    return "action: string expected";
            if (message.trackId != null && $Object.hasOwnProperty.call(message, "trackId"))
                if (!$util.isString(message.trackId))
                    return "trackId: string expected";
            if (message.position != null && $Object.hasOwnProperty.call(message, "position"))
                if (!$util.isInteger(message.position) && !(message.position && $util.isInteger(message.position.low) && $util.isInteger(message.position.high)))
                    return "position: integer|Long expected";
            if (message.trackInfo != null && $Object.hasOwnProperty.call(message, "trackInfo")) {
                let error = $root.listentogether.TrackInfo.verify(message.trackInfo, _depth + 1);
                if (error)
                    return "trackInfo." + error;
            }
            if (message.insertNext != null && $Object.hasOwnProperty.call(message, "insertNext"))
                if (typeof message.insertNext !== "boolean")
                    return "insertNext: boolean expected";
            if (message.queueTitle != null && $Object.hasOwnProperty.call(message, "queueTitle"))
                if (!$util.isString(message.queueTitle))
                    return "queueTitle: string expected";
            if (message.volume != null && $Object.hasOwnProperty.call(message, "volume"))
                if (typeof message.volume !== "number")
                    return "volume: number expected";
            if (message.serverTime != null && $Object.hasOwnProperty.call(message, "serverTime"))
                if (!$util.isInteger(message.serverTime) && !(message.serverTime && $util.isInteger(message.serverTime.low) && $util.isInteger(message.serverTime.high)))
                    return "serverTime: integer|Long expected";
            if (message.revision != null && $Object.hasOwnProperty.call(message, "revision"))
                if (!$util.isInteger(message.revision) && !(message.revision && $util.isInteger(message.revision.low) && $util.isInteger(message.revision.high)))
                    return "revision: integer|Long expected";
            if (message.capturedAtServerTime != null && $Object.hasOwnProperty.call(message, "capturedAtServerTime"))
                if (!$util.isInteger(message.capturedAtServerTime) && !(message.capturedAtServerTime && $util.isInteger(message.capturedAtServerTime.low) && $util.isInteger(message.capturedAtServerTime.high)))
                    return "capturedAtServerTime: integer|Long expected";
            return null;
        };

        /**
         * Creates a PlaybackActionPayload message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof listentogether.PlaybackActionPayload
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {listentogether.PlaybackActionPayload} PlaybackActionPayload
         */
        PlaybackActionPayload.fromObject = function (object, _depth) {
            if (object instanceof $root.listentogether.PlaybackActionPayload)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".listentogether.PlaybackActionPayload: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.listentogether.PlaybackActionPayload();
            if (object.action != null)
                if (typeof object.action !== "string" || object.action.length)
                    message.action = $String(object.action);
            if (object.trackId != null)
                if (typeof object.trackId !== "string" || object.trackId.length)
                    message.trackId = $String(object.trackId);
            if (object.position != null)
                if (typeof object.position === "object" ? object.position.low || object.position.high : $Number(object.position) !== 0)
                    if ($util.Long)
                        message.position = $util.Long.fromValue(object.position, false);
                    else if (typeof object.position === "string")
                        message.position = $parseInt(object.position, 10);
                    else if (typeof object.position === "number")
                        message.position = object.position;
                    else if (typeof object.position === "object")
                        message.position = new $util.LongBits(object.position.low >>> 0, object.position.high >>> 0).toNumber();
            if (object.trackInfo != null) {
                if (!$util.isObject(object.trackInfo))
                    throw $TypeError(".listentogether.PlaybackActionPayload.trackInfo: object expected");
                message.trackInfo = $root.listentogether.TrackInfo.fromObject(object.trackInfo, _depth + 1);
            }
            if (object.insertNext != null)
                if (object.insertNext)
                    message.insertNext = $Boolean(object.insertNext);
            if (object.queueTitle != null)
                if (typeof object.queueTitle !== "string" || object.queueTitle.length)
                    message.queueTitle = $String(object.queueTitle);
            if (object.volume != null)
                if (!$Object.is($Number(object.volume), 0))
                    message.volume = $Number(object.volume);
            if (object.serverTime != null)
                if (typeof object.serverTime === "object" ? object.serverTime.low || object.serverTime.high : $Number(object.serverTime) !== 0)
                    if ($util.Long)
                        message.serverTime = $util.Long.fromValue(object.serverTime, false);
                    else if (typeof object.serverTime === "string")
                        message.serverTime = $parseInt(object.serverTime, 10);
                    else if (typeof object.serverTime === "number")
                        message.serverTime = object.serverTime;
                    else if (typeof object.serverTime === "object")
                        message.serverTime = new $util.LongBits(object.serverTime.low >>> 0, object.serverTime.high >>> 0).toNumber();
            if (object.revision != null)
                if (typeof object.revision === "object" ? object.revision.low || object.revision.high : $Number(object.revision) !== 0)
                    if ($util.Long)
                        message.revision = $util.Long.fromValue(object.revision, true);
                    else if (typeof object.revision === "string")
                        message.revision = $parseInt(object.revision, 10);
                    else if (typeof object.revision === "number")
                        message.revision = object.revision;
                    else if (typeof object.revision === "object")
                        message.revision = new $util.LongBits(object.revision.low >>> 0, object.revision.high >>> 0).toNumber(true);
            if (object.capturedAtServerTime != null)
                if (typeof object.capturedAtServerTime === "object" ? object.capturedAtServerTime.low || object.capturedAtServerTime.high : $Number(object.capturedAtServerTime) !== 0)
                    if ($util.Long)
                        message.capturedAtServerTime = $util.Long.fromValue(object.capturedAtServerTime, false);
                    else if (typeof object.capturedAtServerTime === "string")
                        message.capturedAtServerTime = $parseInt(object.capturedAtServerTime, 10);
                    else if (typeof object.capturedAtServerTime === "number")
                        message.capturedAtServerTime = object.capturedAtServerTime;
                    else if (typeof object.capturedAtServerTime === "object")
                        message.capturedAtServerTime = new $util.LongBits(object.capturedAtServerTime.low >>> 0, object.capturedAtServerTime.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a PlaybackActionPayload message. Also converts values to other types if specified.
         * @function toObject
         * @memberof listentogether.PlaybackActionPayload
         * @static
         * @param {listentogether.PlaybackActionPayload} message PlaybackActionPayload
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PlaybackActionPayload.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.action = "";
                object.trackId = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.position = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.position = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                object.trackInfo = null;
                object.insertNext = false;
                object.queueTitle = "";
                object.volume = 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.serverTime = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.serverTime = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.revision = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.revision = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.capturedAtServerTime = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.capturedAtServerTime = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
            }
            if (message.action != null && $Object.hasOwnProperty.call(message, "action"))
                object.action = message.action;
            if (message.trackId != null && $Object.hasOwnProperty.call(message, "trackId"))
                object.trackId = message.trackId;
            if (message.position != null && $Object.hasOwnProperty.call(message, "position"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.position = typeof message.position === "number" ? $BigInt(message.position) : $util.Long.fromBits(message.position.low >>> 0, message.position.high >>> 0, false).toBigInt();
                else if (typeof message.position === "number")
                    object.position = options.longs === $String ? $String(message.position) : message.position;
                else
                    object.position = options.longs === $String ? $util.Long.prototype.toString.call(message.position) : options.longs === $Number ? new $util.LongBits(message.position.low >>> 0, message.position.high >>> 0).toNumber() : message.position;
            if (message.trackInfo != null && $Object.hasOwnProperty.call(message, "trackInfo"))
                object.trackInfo = $root.listentogether.TrackInfo.toObject(message.trackInfo, options, _depth + 1);
            if (message.insertNext != null && $Object.hasOwnProperty.call(message, "insertNext"))
                object.insertNext = message.insertNext;
            if (message.queueTitle != null && $Object.hasOwnProperty.call(message, "queueTitle"))
                object.queueTitle = message.queueTitle;
            if (message.volume != null && $Object.hasOwnProperty.call(message, "volume"))
                object.volume = options.json && !$isFinite(message.volume) ? $String(message.volume) : message.volume;
            if (message.serverTime != null && $Object.hasOwnProperty.call(message, "serverTime"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.serverTime = typeof message.serverTime === "number" ? $BigInt(message.serverTime) : $util.Long.fromBits(message.serverTime.low >>> 0, message.serverTime.high >>> 0, false).toBigInt();
                else if (typeof message.serverTime === "number")
                    object.serverTime = options.longs === $String ? $String(message.serverTime) : message.serverTime;
                else
                    object.serverTime = options.longs === $String ? $util.Long.prototype.toString.call(message.serverTime) : options.longs === $Number ? new $util.LongBits(message.serverTime.low >>> 0, message.serverTime.high >>> 0).toNumber() : message.serverTime;
            if (message.revision != null && $Object.hasOwnProperty.call(message, "revision"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.revision = typeof message.revision === "number" ? $BigInt(message.revision) : $util.Long.fromBits(message.revision.low >>> 0, message.revision.high >>> 0, true).toBigInt();
                else if (typeof message.revision === "number")
                    object.revision = options.longs === $String ? $String(message.revision) : message.revision;
                else
                    object.revision = options.longs === $String ? $util.Long.prototype.toString.call(message.revision) : options.longs === $Number ? new $util.LongBits(message.revision.low >>> 0, message.revision.high >>> 0).toNumber(true) : message.revision;
            if (message.capturedAtServerTime != null && $Object.hasOwnProperty.call(message, "capturedAtServerTime"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.capturedAtServerTime = typeof message.capturedAtServerTime === "number" ? $BigInt(message.capturedAtServerTime) : $util.Long.fromBits(message.capturedAtServerTime.low >>> 0, message.capturedAtServerTime.high >>> 0, false).toBigInt();
                else if (typeof message.capturedAtServerTime === "number")
                    object.capturedAtServerTime = options.longs === $String ? $String(message.capturedAtServerTime) : message.capturedAtServerTime;
                else
                    object.capturedAtServerTime = options.longs === $String ? $util.Long.prototype.toString.call(message.capturedAtServerTime) : options.longs === $Number ? new $util.LongBits(message.capturedAtServerTime.low >>> 0, message.capturedAtServerTime.high >>> 0).toNumber() : message.capturedAtServerTime;
            return object;
        };

        /**
         * Converts this PlaybackActionPayload to JSON.
         * @function toJSON
         * @memberof listentogether.PlaybackActionPayload
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PlaybackActionPayload.prototype.toJSON = function() {
            return PlaybackActionPayload.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for PlaybackActionPayload
         * @function getTypeUrl
         * @memberof listentogether.PlaybackActionPayload
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        PlaybackActionPayload.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/listentogether.PlaybackActionPayload";
        };

        return PlaybackActionPayload;
    })();

    listentogether.PingPayload = (function() {

        /**
         * Properties of a PingPayload.
         * @typedef {Object} listentogether.PingPayload.$Properties
         * @property {number|Long|null} [clientTime] PingPayload clientTime
         * @property {number|Long|null} [sequence] PingPayload sequence
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a PingPayload.
         * @memberof listentogether
         * @interface IPingPayload
         * @augments listentogether.PingPayload.$Properties
         * @deprecated Use listentogether.PingPayload.$Properties instead.
         */

        /**
         * Shape of a PingPayload.
         * @typedef {listentogether.PingPayload.$Properties} listentogether.PingPayload.$Shape
         */

        /**
         * Constructs a new PingPayload.
         * @memberof listentogether
         * @classdesc Represents a PingPayload.
         * @constructor
         * @param {listentogether.PingPayload.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const PingPayload = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * PingPayload clientTime.
         * @member {number|Long} clientTime
         * @memberof listentogether.PingPayload
         * @instance
         */
        PingPayload.prototype.clientTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * PingPayload sequence.
         * @member {number|Long} sequence
         * @memberof listentogether.PingPayload
         * @instance
         */
        PingPayload.prototype.sequence = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Creates a new PingPayload instance using the specified properties.
         * @function create
         * @memberof listentogether.PingPayload
         * @static
         * @param {listentogether.PingPayload.$Properties=} [properties] Properties to set
         * @returns {listentogether.PingPayload} PingPayload instance
         * @type {{
         *   (properties: listentogether.PingPayload.$Shape): listentogether.PingPayload & listentogether.PingPayload.$Shape;
         *   (properties?: listentogether.PingPayload.$Properties): listentogether.PingPayload;
         * }}
         */
        PingPayload.create = function(properties) {
            return new PingPayload(properties);
        };

        /**
         * Encodes the specified PingPayload message. Does not implicitly {@link listentogether.PingPayload.verify|verify} messages.
         * @function encode
         * @memberof listentogether.PingPayload
         * @static
         * @param {listentogether.PingPayload.$Properties} message PingPayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PingPayload.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.clientTime != null && $Object.hasOwnProperty.call(message, "clientTime") && (typeof message.clientTime === "object" ? message.clientTime.low || message.clientTime.high : message.clientTime !== 0))
                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.clientTime);
            if (message.sequence != null && $Object.hasOwnProperty.call(message, "sequence") && (typeof message.sequence === "object" ? message.sequence.low || message.sequence.high : message.sequence !== 0))
                writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.sequence);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified PingPayload message, length delimited. Does not implicitly {@link listentogether.PingPayload.verify|verify} messages.
         * @function encodeDelimited
         * @memberof listentogether.PingPayload
         * @static
         * @param {listentogether.PingPayload.$Properties} message PingPayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PingPayload.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a PingPayload message from the specified reader or buffer.
         * @function decode
         * @memberof listentogether.PingPayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {listentogether.PingPayload & listentogether.PingPayload.$Shape} PingPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PingPayload.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.listentogether.PingPayload();
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.clientTime = value;
                        else
                            delete message.clientTime;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.sequence = value;
                        else
                            delete message.sequence;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a PingPayload message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof listentogether.PingPayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {listentogether.PingPayload & listentogether.PingPayload.$Shape} PingPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PingPayload.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PingPayload message.
         * @function verify
         * @memberof listentogether.PingPayload
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PingPayload.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.clientTime != null && $Object.hasOwnProperty.call(message, "clientTime"))
                if (!$util.isInteger(message.clientTime) && !(message.clientTime && $util.isInteger(message.clientTime.low) && $util.isInteger(message.clientTime.high)))
                    return "clientTime: integer|Long expected";
            if (message.sequence != null && $Object.hasOwnProperty.call(message, "sequence"))
                if (!$util.isInteger(message.sequence) && !(message.sequence && $util.isInteger(message.sequence.low) && $util.isInteger(message.sequence.high)))
                    return "sequence: integer|Long expected";
            return null;
        };

        /**
         * Creates a PingPayload message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof listentogether.PingPayload
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {listentogether.PingPayload} PingPayload
         */
        PingPayload.fromObject = function (object, _depth) {
            if (object instanceof $root.listentogether.PingPayload)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".listentogether.PingPayload: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.listentogether.PingPayload();
            if (object.clientTime != null)
                if (typeof object.clientTime === "object" ? object.clientTime.low || object.clientTime.high : $Number(object.clientTime) !== 0)
                    if ($util.Long)
                        message.clientTime = $util.Long.fromValue(object.clientTime, false);
                    else if (typeof object.clientTime === "string")
                        message.clientTime = $parseInt(object.clientTime, 10);
                    else if (typeof object.clientTime === "number")
                        message.clientTime = object.clientTime;
                    else if (typeof object.clientTime === "object")
                        message.clientTime = new $util.LongBits(object.clientTime.low >>> 0, object.clientTime.high >>> 0).toNumber();
            if (object.sequence != null)
                if (typeof object.sequence === "object" ? object.sequence.low || object.sequence.high : $Number(object.sequence) !== 0)
                    if ($util.Long)
                        message.sequence = $util.Long.fromValue(object.sequence, true);
                    else if (typeof object.sequence === "string")
                        message.sequence = $parseInt(object.sequence, 10);
                    else if (typeof object.sequence === "number")
                        message.sequence = object.sequence;
                    else if (typeof object.sequence === "object")
                        message.sequence = new $util.LongBits(object.sequence.low >>> 0, object.sequence.high >>> 0).toNumber(true);
            return message;
        };

        /**
         * Creates a plain object from a PingPayload message. Also converts values to other types if specified.
         * @function toObject
         * @memberof listentogether.PingPayload
         * @static
         * @param {listentogether.PingPayload} message PingPayload
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PingPayload.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.clientTime = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.clientTime = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.sequence = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.sequence = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
            }
            if (message.clientTime != null && $Object.hasOwnProperty.call(message, "clientTime"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.clientTime = typeof message.clientTime === "number" ? $BigInt(message.clientTime) : $util.Long.fromBits(message.clientTime.low >>> 0, message.clientTime.high >>> 0, false).toBigInt();
                else if (typeof message.clientTime === "number")
                    object.clientTime = options.longs === $String ? $String(message.clientTime) : message.clientTime;
                else
                    object.clientTime = options.longs === $String ? $util.Long.prototype.toString.call(message.clientTime) : options.longs === $Number ? new $util.LongBits(message.clientTime.low >>> 0, message.clientTime.high >>> 0).toNumber() : message.clientTime;
            if (message.sequence != null && $Object.hasOwnProperty.call(message, "sequence"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.sequence = typeof message.sequence === "number" ? $BigInt(message.sequence) : $util.Long.fromBits(message.sequence.low >>> 0, message.sequence.high >>> 0, true).toBigInt();
                else if (typeof message.sequence === "number")
                    object.sequence = options.longs === $String ? $String(message.sequence) : message.sequence;
                else
                    object.sequence = options.longs === $String ? $util.Long.prototype.toString.call(message.sequence) : options.longs === $Number ? new $util.LongBits(message.sequence.low >>> 0, message.sequence.high >>> 0).toNumber(true) : message.sequence;
            return object;
        };

        /**
         * Converts this PingPayload to JSON.
         * @function toJSON
         * @memberof listentogether.PingPayload
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PingPayload.prototype.toJSON = function() {
            return PingPayload.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for PingPayload
         * @function getTypeUrl
         * @memberof listentogether.PingPayload
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        PingPayload.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/listentogether.PingPayload";
        };

        return PingPayload;
    })();

    return listentogether;
})();

export {
  $root as default
};

var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3548__auto____3051 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____3051)) {
    return or__3548__auto____3051
  }else {
    var or__3548__auto____3052 = p["_"];
    if(cljs.core.truth_(or__3548__auto____3052)) {
      return or__3548__auto____3052
    }else {
      return false
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error.call(null, "No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.aget = function aget(array, i) {
  return array[i]
};
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__3116 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3053 = this$;
      if(cljs.core.truth_(and__3546__auto____3053)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3053
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____3054 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3054)) {
          return or__3548__auto____3054
        }else {
          var or__3548__auto____3055 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3055)) {
            return or__3548__auto____3055
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__3117 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3056 = this$;
      if(cljs.core.truth_(and__3546__auto____3056)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3056
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____3057 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3057)) {
          return or__3548__auto____3057
        }else {
          var or__3548__auto____3058 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3058)) {
            return or__3548__auto____3058
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3118 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3059 = this$;
      if(cljs.core.truth_(and__3546__auto____3059)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3059
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____3060 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3060)) {
          return or__3548__auto____3060
        }else {
          var or__3548__auto____3061 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3061)) {
            return or__3548__auto____3061
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__3119 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3062 = this$;
      if(cljs.core.truth_(and__3546__auto____3062)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3062
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____3063 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3063)) {
          return or__3548__auto____3063
        }else {
          var or__3548__auto____3064 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3064)) {
            return or__3548__auto____3064
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__3120 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3065 = this$;
      if(cljs.core.truth_(and__3546__auto____3065)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3065
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____3066 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3066)) {
          return or__3548__auto____3066
        }else {
          var or__3548__auto____3067 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3067)) {
            return or__3548__auto____3067
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__3121 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3068 = this$;
      if(cljs.core.truth_(and__3546__auto____3068)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3068
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____3069 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3069)) {
          return or__3548__auto____3069
        }else {
          var or__3548__auto____3070 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3070)) {
            return or__3548__auto____3070
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__3122 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3071 = this$;
      if(cljs.core.truth_(and__3546__auto____3071)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3071
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____3072 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3072)) {
          return or__3548__auto____3072
        }else {
          var or__3548__auto____3073 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3073)) {
            return or__3548__auto____3073
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__3123 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3074 = this$;
      if(cljs.core.truth_(and__3546__auto____3074)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3074
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____3075 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3075)) {
          return or__3548__auto____3075
        }else {
          var or__3548__auto____3076 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3076)) {
            return or__3548__auto____3076
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__3124 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3077 = this$;
      if(cljs.core.truth_(and__3546__auto____3077)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3077
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____3078 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3078)) {
          return or__3548__auto____3078
        }else {
          var or__3548__auto____3079 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3079)) {
            return or__3548__auto____3079
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__3125 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3080 = this$;
      if(cljs.core.truth_(and__3546__auto____3080)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3080
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____3081 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3081)) {
          return or__3548__auto____3081
        }else {
          var or__3548__auto____3082 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3082)) {
            return or__3548__auto____3082
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__3126 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3083 = this$;
      if(cljs.core.truth_(and__3546__auto____3083)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3083
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____3084 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3084)) {
          return or__3548__auto____3084
        }else {
          var or__3548__auto____3085 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3085)) {
            return or__3548__auto____3085
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__3127 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3086 = this$;
      if(cljs.core.truth_(and__3546__auto____3086)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3086
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____3087 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3087)) {
          return or__3548__auto____3087
        }else {
          var or__3548__auto____3088 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3088)) {
            return or__3548__auto____3088
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__3128 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3089 = this$;
      if(cljs.core.truth_(and__3546__auto____3089)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3089
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____3090 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3090)) {
          return or__3548__auto____3090
        }else {
          var or__3548__auto____3091 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3091)) {
            return or__3548__auto____3091
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__3129 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3092 = this$;
      if(cljs.core.truth_(and__3546__auto____3092)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3092
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____3093 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3093)) {
          return or__3548__auto____3093
        }else {
          var or__3548__auto____3094 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3094)) {
            return or__3548__auto____3094
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__3130 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3095 = this$;
      if(cljs.core.truth_(and__3546__auto____3095)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3095
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____3096 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3096)) {
          return or__3548__auto____3096
        }else {
          var or__3548__auto____3097 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3097)) {
            return or__3548__auto____3097
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__3131 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3098 = this$;
      if(cljs.core.truth_(and__3546__auto____3098)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3098
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____3099 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3099)) {
          return or__3548__auto____3099
        }else {
          var or__3548__auto____3100 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3100)) {
            return or__3548__auto____3100
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__3132 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3101 = this$;
      if(cljs.core.truth_(and__3546__auto____3101)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3101
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____3102 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3102)) {
          return or__3548__auto____3102
        }else {
          var or__3548__auto____3103 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3103)) {
            return or__3548__auto____3103
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__3133 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3104 = this$;
      if(cljs.core.truth_(and__3546__auto____3104)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3104
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____3105 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3105)) {
          return or__3548__auto____3105
        }else {
          var or__3548__auto____3106 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3106)) {
            return or__3548__auto____3106
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__3134 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3107 = this$;
      if(cljs.core.truth_(and__3546__auto____3107)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3107
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____3108 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3108)) {
          return or__3548__auto____3108
        }else {
          var or__3548__auto____3109 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3109)) {
            return or__3548__auto____3109
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__3135 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3110 = this$;
      if(cljs.core.truth_(and__3546__auto____3110)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3110
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____3111 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3111)) {
          return or__3548__auto____3111
        }else {
          var or__3548__auto____3112 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3112)) {
            return or__3548__auto____3112
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__3136 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3113 = this$;
      if(cljs.core.truth_(and__3546__auto____3113)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3113
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____3114 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3114)) {
          return or__3548__auto____3114
        }else {
          var or__3548__auto____3115 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3115)) {
            return or__3548__auto____3115
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__3116.call(this, this$);
      case 2:
        return _invoke__3117.call(this, this$, a);
      case 3:
        return _invoke__3118.call(this, this$, a, b);
      case 4:
        return _invoke__3119.call(this, this$, a, b, c);
      case 5:
        return _invoke__3120.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__3121.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__3122.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__3123.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__3124.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__3125.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__3126.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__3127.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__3128.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__3129.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__3130.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__3131.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__3132.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__3133.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__3134.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__3135.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__3136.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3138 = coll;
    if(cljs.core.truth_(and__3546__auto____3138)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____3138
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____3139 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3139)) {
        return or__3548__auto____3139
      }else {
        var or__3548__auto____3140 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____3140)) {
          return or__3548__auto____3140
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3141 = coll;
    if(cljs.core.truth_(and__3546__auto____3141)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____3141
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____3142 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3142)) {
        return or__3548__auto____3142
      }else {
        var or__3548__auto____3143 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____3143)) {
          return or__3548__auto____3143
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3144 = coll;
    if(cljs.core.truth_(and__3546__auto____3144)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____3144
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____3145 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3145)) {
        return or__3548__auto____3145
      }else {
        var or__3548__auto____3146 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____3146)) {
          return or__3548__auto____3146
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__3153 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3147 = coll;
      if(cljs.core.truth_(and__3546__auto____3147)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____3147
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____3148 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3148)) {
          return or__3548__auto____3148
        }else {
          var or__3548__auto____3149 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____3149)) {
            return or__3548__auto____3149
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3154 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3150 = coll;
      if(cljs.core.truth_(and__3546__auto____3150)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____3150
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____3151 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3151)) {
          return or__3548__auto____3151
        }else {
          var or__3548__auto____3152 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____3152)) {
            return or__3548__auto____3152
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__3153.call(this, coll, n);
      case 3:
        return _nth__3154.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3156 = coll;
    if(cljs.core.truth_(and__3546__auto____3156)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____3156
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____3157 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3157)) {
        return or__3548__auto____3157
      }else {
        var or__3548__auto____3158 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____3158)) {
          return or__3548__auto____3158
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3159 = coll;
    if(cljs.core.truth_(and__3546__auto____3159)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____3159
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____3160 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3160)) {
        return or__3548__auto____3160
      }else {
        var or__3548__auto____3161 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____3161)) {
          return or__3548__auto____3161
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__3168 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3162 = o;
      if(cljs.core.truth_(and__3546__auto____3162)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____3162
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____3163 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____3163)) {
          return or__3548__auto____3163
        }else {
          var or__3548__auto____3164 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____3164)) {
            return or__3548__auto____3164
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3169 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3165 = o;
      if(cljs.core.truth_(and__3546__auto____3165)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____3165
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____3166 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____3166)) {
          return or__3548__auto____3166
        }else {
          var or__3548__auto____3167 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____3167)) {
            return or__3548__auto____3167
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__3168.call(this, o, k);
      case 3:
        return _lookup__3169.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3171 = coll;
    if(cljs.core.truth_(and__3546__auto____3171)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____3171
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____3172 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3172)) {
        return or__3548__auto____3172
      }else {
        var or__3548__auto____3173 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____3173)) {
          return or__3548__auto____3173
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3174 = coll;
    if(cljs.core.truth_(and__3546__auto____3174)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____3174
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____3175 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3175)) {
        return or__3548__auto____3175
      }else {
        var or__3548__auto____3176 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____3176)) {
          return or__3548__auto____3176
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3177 = coll;
    if(cljs.core.truth_(and__3546__auto____3177)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____3177
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____3178 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3178)) {
        return or__3548__auto____3178
      }else {
        var or__3548__auto____3179 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____3179)) {
          return or__3548__auto____3179
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3180 = coll;
    if(cljs.core.truth_(and__3546__auto____3180)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____3180
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____3181 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3181)) {
        return or__3548__auto____3181
      }else {
        var or__3548__auto____3182 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____3182)) {
          return or__3548__auto____3182
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3183 = coll;
    if(cljs.core.truth_(and__3546__auto____3183)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____3183
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____3184 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3184)) {
        return or__3548__auto____3184
      }else {
        var or__3548__auto____3185 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____3185)) {
          return or__3548__auto____3185
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3186 = coll;
    if(cljs.core.truth_(and__3546__auto____3186)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____3186
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____3187 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3187)) {
        return or__3548__auto____3187
      }else {
        var or__3548__auto____3188 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____3188)) {
          return or__3548__auto____3188
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3189 = coll;
    if(cljs.core.truth_(and__3546__auto____3189)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____3189
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____3190 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3190)) {
        return or__3548__auto____3190
      }else {
        var or__3548__auto____3191 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____3191)) {
          return or__3548__auto____3191
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3192 = o;
    if(cljs.core.truth_(and__3546__auto____3192)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____3192
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____3193 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3193)) {
        return or__3548__auto____3193
      }else {
        var or__3548__auto____3194 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____3194)) {
          return or__3548__auto____3194
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3195 = o;
    if(cljs.core.truth_(and__3546__auto____3195)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____3195
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____3196 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3196)) {
        return or__3548__auto____3196
      }else {
        var or__3548__auto____3197 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____3197)) {
          return or__3548__auto____3197
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3198 = o;
    if(cljs.core.truth_(and__3546__auto____3198)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____3198
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____3199 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3199)) {
        return or__3548__auto____3199
      }else {
        var or__3548__auto____3200 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____3200)) {
          return or__3548__auto____3200
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3201 = o;
    if(cljs.core.truth_(and__3546__auto____3201)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____3201
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____3202 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3202)) {
        return or__3548__auto____3202
      }else {
        var or__3548__auto____3203 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____3203)) {
          return or__3548__auto____3203
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__3210 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3204 = coll;
      if(cljs.core.truth_(and__3546__auto____3204)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____3204
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____3205 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3205)) {
          return or__3548__auto____3205
        }else {
          var or__3548__auto____3206 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____3206)) {
            return or__3548__auto____3206
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3211 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3207 = coll;
      if(cljs.core.truth_(and__3546__auto____3207)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____3207
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____3208 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3208)) {
          return or__3548__auto____3208
        }else {
          var or__3548__auto____3209 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____3209)) {
            return or__3548__auto____3209
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__3210.call(this, coll, f);
      case 3:
        return _reduce__3211.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3213 = o;
    if(cljs.core.truth_(and__3546__auto____3213)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____3213
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____3214 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3214)) {
        return or__3548__auto____3214
      }else {
        var or__3548__auto____3215 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____3215)) {
          return or__3548__auto____3215
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3216 = o;
    if(cljs.core.truth_(and__3546__auto____3216)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____3216
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____3217 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3217)) {
        return or__3548__auto____3217
      }else {
        var or__3548__auto____3218 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____3218)) {
          return or__3548__auto____3218
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3219 = o;
    if(cljs.core.truth_(and__3546__auto____3219)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____3219
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____3220 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3220)) {
        return or__3548__auto____3220
      }else {
        var or__3548__auto____3221 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____3221)) {
          return or__3548__auto____3221
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IRecord = {};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3222 = o;
    if(cljs.core.truth_(and__3546__auto____3222)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____3222
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____3223 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3223)) {
        return or__3548__auto____3223
      }else {
        var or__3548__auto____3224 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____3224)) {
          return or__3548__auto____3224
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3225 = d;
    if(cljs.core.truth_(and__3546__auto____3225)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____3225
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____3226 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____3226)) {
        return or__3548__auto____3226
      }else {
        var or__3548__auto____3227 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____3227)) {
          return or__3548__auto____3227
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3228 = this$;
    if(cljs.core.truth_(and__3546__auto____3228)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____3228
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____3229 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____3229)) {
        return or__3548__auto____3229
      }else {
        var or__3548__auto____3230 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____3230)) {
          return or__3548__auto____3230
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3231 = this$;
    if(cljs.core.truth_(and__3546__auto____3231)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____3231
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____3232 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____3232)) {
        return or__3548__auto____3232
      }else {
        var or__3548__auto____3233 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____3233)) {
          return or__3548__auto____3233
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3234 = this$;
    if(cljs.core.truth_(and__3546__auto____3234)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____3234
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____3235 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____3235)) {
        return or__3548__auto____3235
      }else {
        var or__3548__auto____3236 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____3236)) {
          return or__3548__auto____3236
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function _EQ_(x, y) {
  return cljs.core._equiv.call(null, x, y)
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x === null
};
cljs.core.type = function type(x) {
  return x.constructor
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__3237 = null;
  var G__3237__3238 = function(o, k) {
    return null
  };
  var G__3237__3239 = function(o, k, not_found) {
    return not_found
  };
  G__3237 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3237__3238.call(this, o, k);
      case 3:
        return G__3237__3239.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3237
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__3241 = null;
  var G__3241__3242 = function(_, f) {
    return f.call(null)
  };
  var G__3241__3243 = function(_, f, start) {
    return start
  };
  G__3241 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3241__3242.call(this, _, f);
      case 3:
        return G__3241__3243.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3241
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o === null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__3245 = null;
  var G__3245__3246 = function(_, n) {
    return null
  };
  var G__3245__3247 = function(_, n, not_found) {
    return not_found
  };
  G__3245 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3245__3246.call(this, _, n);
      case 3:
        return G__3245__3247.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3245
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__3255 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__3249 = cljs.core._nth.call(null, cicoll, 0);
      var n__3250 = 1;
      while(true) {
        if(cljs.core.truth_(n__3250 < cljs.core._count.call(null, cicoll))) {
          var G__3259 = f.call(null, val__3249, cljs.core._nth.call(null, cicoll, n__3250));
          var G__3260 = n__3250 + 1;
          val__3249 = G__3259;
          n__3250 = G__3260;
          continue
        }else {
          return val__3249
        }
        break
      }
    }
  };
  var ci_reduce__3256 = function(cicoll, f, val) {
    var val__3251 = val;
    var n__3252 = 0;
    while(true) {
      if(cljs.core.truth_(n__3252 < cljs.core._count.call(null, cicoll))) {
        var G__3261 = f.call(null, val__3251, cljs.core._nth.call(null, cicoll, n__3252));
        var G__3262 = n__3252 + 1;
        val__3251 = G__3261;
        n__3252 = G__3262;
        continue
      }else {
        return val__3251
      }
      break
    }
  };
  var ci_reduce__3257 = function(cicoll, f, val, idx) {
    var val__3253 = val;
    var n__3254 = idx;
    while(true) {
      if(cljs.core.truth_(n__3254 < cljs.core._count.call(null, cicoll))) {
        var G__3263 = f.call(null, val__3253, cljs.core._nth.call(null, cicoll, n__3254));
        var G__3264 = n__3254 + 1;
        val__3253 = G__3263;
        n__3254 = G__3264;
        continue
      }else {
        return val__3253
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__3255.call(this, cicoll, f);
      case 3:
        return ci_reduce__3256.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__3257.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ci_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i
};
cljs.core.IndexedSeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3265 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__3278 = null;
  var G__3278__3279 = function(_, f) {
    var this__3266 = this;
    return cljs.core.ci_reduce.call(null, this__3266.a, f, this__3266.a[this__3266.i], this__3266.i + 1)
  };
  var G__3278__3280 = function(_, f, start) {
    var this__3267 = this;
    return cljs.core.ci_reduce.call(null, this__3267.a, f, start, this__3267.i)
  };
  G__3278 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3278__3279.call(this, _, f);
      case 3:
        return G__3278__3280.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3278
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3268 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3269 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__3282 = null;
  var G__3282__3283 = function(coll, n) {
    var this__3270 = this;
    var i__3271 = n + this__3270.i;
    if(cljs.core.truth_(i__3271 < this__3270.a.length)) {
      return this__3270.a[i__3271]
    }else {
      return null
    }
  };
  var G__3282__3284 = function(coll, n, not_found) {
    var this__3272 = this;
    var i__3273 = n + this__3272.i;
    if(cljs.core.truth_(i__3273 < this__3272.a.length)) {
      return this__3272.a[i__3273]
    }else {
      return not_found
    }
  };
  G__3282 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3282__3283.call(this, coll, n);
      case 3:
        return G__3282__3284.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3282
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__3274 = this;
  return this__3274.a.length - this__3274.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__3275 = this;
  return this__3275.a[this__3275.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__3276 = this;
  if(cljs.core.truth_(this__3276.i + 1 < this__3276.a.length)) {
    return new cljs.core.IndexedSeq(this__3276.a, this__3276.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__3277 = this;
  return this$
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, prim.length))) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__3286 = null;
  var G__3286__3287 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__3286__3288 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__3286 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3286__3287.call(this, array, f);
      case 3:
        return G__3286__3288.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3286
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__3290 = null;
  var G__3290__3291 = function(array, k) {
    return array[k]
  };
  var G__3290__3292 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__3290 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3290__3291.call(this, array, k);
      case 3:
        return G__3290__3292.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3290
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__3294 = null;
  var G__3294__3295 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__3294__3296 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__3294 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3294__3295.call(this, array, n);
      case 3:
        return G__3294__3296.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3294
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  var temp__3698__auto____3298 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____3298)) {
    var s__3299 = temp__3698__auto____3298;
    return cljs.core._first.call(null, s__3299)
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  return cljs.core._rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__3300 = cljs.core.next.call(null, s);
      s = G__3300;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__3301 = cljs.core.seq.call(null, x);
  var n__3302 = 0;
  while(true) {
    if(cljs.core.truth_(s__3301)) {
      var G__3303 = cljs.core.next.call(null, s__3301);
      var G__3304 = n__3302 + 1;
      s__3301 = G__3303;
      n__3302 = G__3304;
      continue
    }else {
      return n__3302
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__3305 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3306 = function() {
    var G__3308__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__3309 = conj.call(null, coll, x);
          var G__3310 = cljs.core.first.call(null, xs);
          var G__3311 = cljs.core.next.call(null, xs);
          coll = G__3309;
          x = G__3310;
          xs = G__3311;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__3308 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3308__delegate.call(this, coll, x, xs)
    };
    G__3308.cljs$lang$maxFixedArity = 2;
    G__3308.cljs$lang$applyTo = function(arglist__3312) {
      var coll = cljs.core.first(arglist__3312);
      var x = cljs.core.first(cljs.core.next(arglist__3312));
      var xs = cljs.core.rest(cljs.core.next(arglist__3312));
      return G__3308__delegate.call(this, coll, x, xs)
    };
    return G__3308
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__3305.call(this, coll, x);
      default:
        return conj__3306.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3306.cljs$lang$applyTo;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.count = function count(coll) {
  return cljs.core._count.call(null, coll)
};
cljs.core.nth = function() {
  var nth = null;
  var nth__3313 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__3314 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__3313.call(this, coll, n);
      case 3:
        return nth__3314.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__3316 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3317 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__3316.call(this, o, k);
      case 3:
        return get__3317.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3320 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__3321 = function() {
    var G__3323__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__3319 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__3324 = ret__3319;
          var G__3325 = cljs.core.first.call(null, kvs);
          var G__3326 = cljs.core.second.call(null, kvs);
          var G__3327 = cljs.core.nnext.call(null, kvs);
          coll = G__3324;
          k = G__3325;
          v = G__3326;
          kvs = G__3327;
          continue
        }else {
          return ret__3319
        }
        break
      }
    };
    var G__3323 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3323__delegate.call(this, coll, k, v, kvs)
    };
    G__3323.cljs$lang$maxFixedArity = 3;
    G__3323.cljs$lang$applyTo = function(arglist__3328) {
      var coll = cljs.core.first(arglist__3328);
      var k = cljs.core.first(cljs.core.next(arglist__3328));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3328)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3328)));
      return G__3323__delegate.call(this, coll, k, v, kvs)
    };
    return G__3323
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3320.call(this, coll, k, v);
      default:
        return assoc__3321.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__3321.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__3330 = function(coll) {
    return coll
  };
  var dissoc__3331 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3332 = function() {
    var G__3334__delegate = function(coll, k, ks) {
      while(true) {
        var ret__3329 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3335 = ret__3329;
          var G__3336 = cljs.core.first.call(null, ks);
          var G__3337 = cljs.core.next.call(null, ks);
          coll = G__3335;
          k = G__3336;
          ks = G__3337;
          continue
        }else {
          return ret__3329
        }
        break
      }
    };
    var G__3334 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3334__delegate.call(this, coll, k, ks)
    };
    G__3334.cljs$lang$maxFixedArity = 2;
    G__3334.cljs$lang$applyTo = function(arglist__3338) {
      var coll = cljs.core.first(arglist__3338);
      var k = cljs.core.first(cljs.core.next(arglist__3338));
      var ks = cljs.core.rest(cljs.core.next(arglist__3338));
      return G__3334__delegate.call(this, coll, k, ks)
    };
    return G__3334
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__3330.call(this, coll);
      case 2:
        return dissoc__3331.call(this, coll, k);
      default:
        return dissoc__3332.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3332.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__450__auto____3339 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3340 = x__450__auto____3339;
      if(cljs.core.truth_(and__3546__auto____3340)) {
        var and__3546__auto____3341 = x__450__auto____3339.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____3341)) {
          return cljs.core.not.call(null, x__450__auto____3339.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____3341
        }
      }else {
        return and__3546__auto____3340
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____3339)
    }
  }())) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__3343 = function(coll) {
    return coll
  };
  var disj__3344 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3345 = function() {
    var G__3347__delegate = function(coll, k, ks) {
      while(true) {
        var ret__3342 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3348 = ret__3342;
          var G__3349 = cljs.core.first.call(null, ks);
          var G__3350 = cljs.core.next.call(null, ks);
          coll = G__3348;
          k = G__3349;
          ks = G__3350;
          continue
        }else {
          return ret__3342
        }
        break
      }
    };
    var G__3347 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3347__delegate.call(this, coll, k, ks)
    };
    G__3347.cljs$lang$maxFixedArity = 2;
    G__3347.cljs$lang$applyTo = function(arglist__3351) {
      var coll = cljs.core.first(arglist__3351);
      var k = cljs.core.first(cljs.core.next(arglist__3351));
      var ks = cljs.core.rest(cljs.core.next(arglist__3351));
      return G__3347__delegate.call(this, coll, k, ks)
    };
    return G__3347
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__3343.call(this, coll);
      case 2:
        return disj__3344.call(this, coll, k);
      default:
        return disj__3345.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3345.cljs$lang$applyTo;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____3352 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3353 = x__450__auto____3352;
      if(cljs.core.truth_(and__3546__auto____3353)) {
        var and__3546__auto____3354 = x__450__auto____3352.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____3354)) {
          return cljs.core.not.call(null, x__450__auto____3352.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____3354
        }
      }else {
        return and__3546__auto____3353
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__450__auto____3352)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____3355 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3356 = x__450__auto____3355;
      if(cljs.core.truth_(and__3546__auto____3356)) {
        var and__3546__auto____3357 = x__450__auto____3355.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____3357)) {
          return cljs.core.not.call(null, x__450__auto____3355.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____3357
        }
      }else {
        return and__3546__auto____3356
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__450__auto____3355)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__450__auto____3358 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3359 = x__450__auto____3358;
    if(cljs.core.truth_(and__3546__auto____3359)) {
      var and__3546__auto____3360 = x__450__auto____3358.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____3360)) {
        return cljs.core.not.call(null, x__450__auto____3358.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____3360
      }
    }else {
      return and__3546__auto____3359
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__450__auto____3358)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__450__auto____3361 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3362 = x__450__auto____3361;
    if(cljs.core.truth_(and__3546__auto____3362)) {
      var and__3546__auto____3363 = x__450__auto____3361.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____3363)) {
        return cljs.core.not.call(null, x__450__auto____3361.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____3363
      }
    }else {
      return and__3546__auto____3362
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__450__auto____3361)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__450__auto____3364 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3365 = x__450__auto____3364;
    if(cljs.core.truth_(and__3546__auto____3365)) {
      var and__3546__auto____3366 = x__450__auto____3364.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____3366)) {
        return cljs.core.not.call(null, x__450__auto____3364.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____3366
      }
    }else {
      return and__3546__auto____3365
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__450__auto____3364)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____3367 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3368 = x__450__auto____3367;
      if(cljs.core.truth_(and__3546__auto____3368)) {
        var and__3546__auto____3369 = x__450__auto____3367.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____3369)) {
          return cljs.core.not.call(null, x__450__auto____3367.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____3369
        }
      }else {
        return and__3546__auto____3368
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__450__auto____3367)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__450__auto____3370 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3371 = x__450__auto____3370;
    if(cljs.core.truth_(and__3546__auto____3371)) {
      var and__3546__auto____3372 = x__450__auto____3370.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____3372)) {
        return cljs.core.not.call(null, x__450__auto____3370.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____3372
      }
    }else {
      return and__3546__auto____3371
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__450__auto____3370)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__3373 = cljs.core.array.call(null);
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__3373.push(key)
  });
  return keys__3373
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.lookup_sentinel = cljs.core.js_obj.call(null);
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(cljs.core.truth_(s === null)) {
    return false
  }else {
    var x__450__auto____3374 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3375 = x__450__auto____3374;
      if(cljs.core.truth_(and__3546__auto____3375)) {
        var and__3546__auto____3376 = x__450__auto____3374.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____3376)) {
          return cljs.core.not.call(null, x__450__auto____3374.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____3376
        }
      }else {
        return and__3546__auto____3375
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__450__auto____3374)
    }
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____3377 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3377)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____3378 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____3378)) {
        return or__3548__auto____3378
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____3377
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____3379 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3379)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____3379
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____3380 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3380)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____3380
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____3381 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____3381)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____3381
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.truth_(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3382 = coll;
    if(cljs.core.truth_(and__3546__auto____3382)) {
      var and__3546__auto____3383 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____3383)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____3383
      }
    }else {
      return and__3546__auto____3382
    }
  }())) {
    return cljs.core.Vector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___3388 = function(x) {
    return true
  };
  var distinct_QMARK___3389 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3390 = function() {
    var G__3392__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__3384 = cljs.core.set([y, x]);
        var xs__3385 = more;
        while(true) {
          var x__3386 = cljs.core.first.call(null, xs__3385);
          var etc__3387 = cljs.core.next.call(null, xs__3385);
          if(cljs.core.truth_(xs__3385)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__3384, x__3386))) {
              return false
            }else {
              var G__3393 = cljs.core.conj.call(null, s__3384, x__3386);
              var G__3394 = etc__3387;
              s__3384 = G__3393;
              xs__3385 = G__3394;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__3392 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3392__delegate.call(this, x, y, more)
    };
    G__3392.cljs$lang$maxFixedArity = 2;
    G__3392.cljs$lang$applyTo = function(arglist__3395) {
      var x = cljs.core.first(arglist__3395);
      var y = cljs.core.first(cljs.core.next(arglist__3395));
      var more = cljs.core.rest(cljs.core.next(arglist__3395));
      return G__3392__delegate.call(this, x, y, more)
    };
    return G__3392
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___3388.call(this, x);
      case 2:
        return distinct_QMARK___3389.call(this, x, y);
      default:
        return distinct_QMARK___3390.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3390.cljs$lang$applyTo;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  return goog.array.defaultCompare.call(null, x, y)
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, f, cljs.core.compare))) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__3396 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__3396))) {
        return r__3396
      }else {
        if(cljs.core.truth_(r__3396)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__3398 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__3399 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__3397 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__3397, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__3397)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__3398.call(this, comp);
      case 2:
        return sort__3399.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__3401 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3402 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__3401.call(this, keyfn, comp);
      case 3:
        return sort_by__3402.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__3404 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__3405 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__3404.call(this, f, val);
      case 3:
        return reduce__3405.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__3411 = function(f, coll) {
    var temp__3695__auto____3407 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____3407)) {
      var s__3408 = temp__3695__auto____3407;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__3408), cljs.core.next.call(null, s__3408))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3412 = function(f, val, coll) {
    var val__3409 = val;
    var coll__3410 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__3410)) {
        var G__3414 = f.call(null, val__3409, cljs.core.first.call(null, coll__3410));
        var G__3415 = cljs.core.next.call(null, coll__3410);
        val__3409 = G__3414;
        coll__3410 = G__3415;
        continue
      }else {
        return val__3409
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__3411.call(this, f, val);
      case 3:
        return seq_reduce__3412.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__3416 = null;
  var G__3416__3417 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__3416__3418 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__3416 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3416__3417.call(this, coll, f);
      case 3:
        return G__3416__3418.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3416
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___3420 = function() {
    return 0
  };
  var _PLUS___3421 = function(x) {
    return x
  };
  var _PLUS___3422 = function(x, y) {
    return x + y
  };
  var _PLUS___3423 = function() {
    var G__3425__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__3425 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3425__delegate.call(this, x, y, more)
    };
    G__3425.cljs$lang$maxFixedArity = 2;
    G__3425.cljs$lang$applyTo = function(arglist__3426) {
      var x = cljs.core.first(arglist__3426);
      var y = cljs.core.first(cljs.core.next(arglist__3426));
      var more = cljs.core.rest(cljs.core.next(arglist__3426));
      return G__3425__delegate.call(this, x, y, more)
    };
    return G__3425
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___3420.call(this);
      case 1:
        return _PLUS___3421.call(this, x);
      case 2:
        return _PLUS___3422.call(this, x, y);
      default:
        return _PLUS___3423.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3423.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___3427 = function(x) {
    return-x
  };
  var ___3428 = function(x, y) {
    return x - y
  };
  var ___3429 = function() {
    var G__3431__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__3431 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3431__delegate.call(this, x, y, more)
    };
    G__3431.cljs$lang$maxFixedArity = 2;
    G__3431.cljs$lang$applyTo = function(arglist__3432) {
      var x = cljs.core.first(arglist__3432);
      var y = cljs.core.first(cljs.core.next(arglist__3432));
      var more = cljs.core.rest(cljs.core.next(arglist__3432));
      return G__3431__delegate.call(this, x, y, more)
    };
    return G__3431
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___3427.call(this, x);
      case 2:
        return ___3428.call(this, x, y);
      default:
        return ___3429.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3429.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___3433 = function() {
    return 1
  };
  var _STAR___3434 = function(x) {
    return x
  };
  var _STAR___3435 = function(x, y) {
    return x * y
  };
  var _STAR___3436 = function() {
    var G__3438__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__3438 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3438__delegate.call(this, x, y, more)
    };
    G__3438.cljs$lang$maxFixedArity = 2;
    G__3438.cljs$lang$applyTo = function(arglist__3439) {
      var x = cljs.core.first(arglist__3439);
      var y = cljs.core.first(cljs.core.next(arglist__3439));
      var more = cljs.core.rest(cljs.core.next(arglist__3439));
      return G__3438__delegate.call(this, x, y, more)
    };
    return G__3438
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___3433.call(this);
      case 1:
        return _STAR___3434.call(this, x);
      case 2:
        return _STAR___3435.call(this, x, y);
      default:
        return _STAR___3436.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3436.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___3440 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___3441 = function(x, y) {
    return x / y
  };
  var _SLASH___3442 = function() {
    var G__3444__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__3444 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3444__delegate.call(this, x, y, more)
    };
    G__3444.cljs$lang$maxFixedArity = 2;
    G__3444.cljs$lang$applyTo = function(arglist__3445) {
      var x = cljs.core.first(arglist__3445);
      var y = cljs.core.first(cljs.core.next(arglist__3445));
      var more = cljs.core.rest(cljs.core.next(arglist__3445));
      return G__3444__delegate.call(this, x, y, more)
    };
    return G__3444
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___3440.call(this, x);
      case 2:
        return _SLASH___3441.call(this, x, y);
      default:
        return _SLASH___3442.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3442.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___3446 = function(x) {
    return true
  };
  var _LT___3447 = function(x, y) {
    return x < y
  };
  var _LT___3448 = function() {
    var G__3450__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3451 = y;
            var G__3452 = cljs.core.first.call(null, more);
            var G__3453 = cljs.core.next.call(null, more);
            x = G__3451;
            y = G__3452;
            more = G__3453;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3450 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3450__delegate.call(this, x, y, more)
    };
    G__3450.cljs$lang$maxFixedArity = 2;
    G__3450.cljs$lang$applyTo = function(arglist__3454) {
      var x = cljs.core.first(arglist__3454);
      var y = cljs.core.first(cljs.core.next(arglist__3454));
      var more = cljs.core.rest(cljs.core.next(arglist__3454));
      return G__3450__delegate.call(this, x, y, more)
    };
    return G__3450
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___3446.call(this, x);
      case 2:
        return _LT___3447.call(this, x, y);
      default:
        return _LT___3448.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3448.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___3455 = function(x) {
    return true
  };
  var _LT__EQ___3456 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3457 = function() {
    var G__3459__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3460 = y;
            var G__3461 = cljs.core.first.call(null, more);
            var G__3462 = cljs.core.next.call(null, more);
            x = G__3460;
            y = G__3461;
            more = G__3462;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3459 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3459__delegate.call(this, x, y, more)
    };
    G__3459.cljs$lang$maxFixedArity = 2;
    G__3459.cljs$lang$applyTo = function(arglist__3463) {
      var x = cljs.core.first(arglist__3463);
      var y = cljs.core.first(cljs.core.next(arglist__3463));
      var more = cljs.core.rest(cljs.core.next(arglist__3463));
      return G__3459__delegate.call(this, x, y, more)
    };
    return G__3459
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___3455.call(this, x);
      case 2:
        return _LT__EQ___3456.call(this, x, y);
      default:
        return _LT__EQ___3457.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3457.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___3464 = function(x) {
    return true
  };
  var _GT___3465 = function(x, y) {
    return x > y
  };
  var _GT___3466 = function() {
    var G__3468__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3469 = y;
            var G__3470 = cljs.core.first.call(null, more);
            var G__3471 = cljs.core.next.call(null, more);
            x = G__3469;
            y = G__3470;
            more = G__3471;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3468 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3468__delegate.call(this, x, y, more)
    };
    G__3468.cljs$lang$maxFixedArity = 2;
    G__3468.cljs$lang$applyTo = function(arglist__3472) {
      var x = cljs.core.first(arglist__3472);
      var y = cljs.core.first(cljs.core.next(arglist__3472));
      var more = cljs.core.rest(cljs.core.next(arglist__3472));
      return G__3468__delegate.call(this, x, y, more)
    };
    return G__3468
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___3464.call(this, x);
      case 2:
        return _GT___3465.call(this, x, y);
      default:
        return _GT___3466.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3466.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___3473 = function(x) {
    return true
  };
  var _GT__EQ___3474 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3475 = function() {
    var G__3477__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3478 = y;
            var G__3479 = cljs.core.first.call(null, more);
            var G__3480 = cljs.core.next.call(null, more);
            x = G__3478;
            y = G__3479;
            more = G__3480;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3477 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3477__delegate.call(this, x, y, more)
    };
    G__3477.cljs$lang$maxFixedArity = 2;
    G__3477.cljs$lang$applyTo = function(arglist__3481) {
      var x = cljs.core.first(arglist__3481);
      var y = cljs.core.first(cljs.core.next(arglist__3481));
      var more = cljs.core.rest(cljs.core.next(arglist__3481));
      return G__3477__delegate.call(this, x, y, more)
    };
    return G__3477
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___3473.call(this, x);
      case 2:
        return _GT__EQ___3474.call(this, x, y);
      default:
        return _GT__EQ___3475.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3475.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__3482 = function(x) {
    return x
  };
  var max__3483 = function(x, y) {
    return x > y ? x : y
  };
  var max__3484 = function() {
    var G__3486__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__3486 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3486__delegate.call(this, x, y, more)
    };
    G__3486.cljs$lang$maxFixedArity = 2;
    G__3486.cljs$lang$applyTo = function(arglist__3487) {
      var x = cljs.core.first(arglist__3487);
      var y = cljs.core.first(cljs.core.next(arglist__3487));
      var more = cljs.core.rest(cljs.core.next(arglist__3487));
      return G__3486__delegate.call(this, x, y, more)
    };
    return G__3486
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__3482.call(this, x);
      case 2:
        return max__3483.call(this, x, y);
      default:
        return max__3484.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3484.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__3488 = function(x) {
    return x
  };
  var min__3489 = function(x, y) {
    return x < y ? x : y
  };
  var min__3490 = function() {
    var G__3492__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__3492 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3492__delegate.call(this, x, y, more)
    };
    G__3492.cljs$lang$maxFixedArity = 2;
    G__3492.cljs$lang$applyTo = function(arglist__3493) {
      var x = cljs.core.first(arglist__3493);
      var y = cljs.core.first(cljs.core.next(arglist__3493));
      var more = cljs.core.rest(cljs.core.next(arglist__3493));
      return G__3492__delegate.call(this, x, y, more)
    };
    return G__3492
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__3488.call(this, x);
      case 2:
        return min__3489.call(this, x, y);
      default:
        return min__3490.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3490.cljs$lang$applyTo;
  return min
}();
cljs.core.fix = function fix(q) {
  if(cljs.core.truth_(q >= 0)) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__3494 = n % d;
  return cljs.core.fix.call(null, (n - rem__3494) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__3495 = cljs.core.quot.call(null, n, d);
  return n - d * q__3495
};
cljs.core.rand = function() {
  var rand = null;
  var rand__3496 = function() {
    return Math.random.call(null)
  };
  var rand__3497 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__3496.call(this);
      case 1:
        return rand__3497.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___3499 = function(x) {
    return true
  };
  var _EQ__EQ___3500 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3501 = function() {
    var G__3503__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3504 = y;
            var G__3505 = cljs.core.first.call(null, more);
            var G__3506 = cljs.core.next.call(null, more);
            x = G__3504;
            y = G__3505;
            more = G__3506;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3503 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3503__delegate.call(this, x, y, more)
    };
    G__3503.cljs$lang$maxFixedArity = 2;
    G__3503.cljs$lang$applyTo = function(arglist__3507) {
      var x = cljs.core.first(arglist__3507);
      var y = cljs.core.first(cljs.core.next(arglist__3507));
      var more = cljs.core.rest(cljs.core.next(arglist__3507));
      return G__3503__delegate.call(this, x, y, more)
    };
    return G__3503
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___3499.call(this, x);
      case 2:
        return _EQ__EQ___3500.call(this, x, y);
      default:
        return _EQ__EQ___3501.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3501.cljs$lang$applyTo;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__3508 = n;
  var xs__3509 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3510 = xs__3509;
      if(cljs.core.truth_(and__3546__auto____3510)) {
        return n__3508 > 0
      }else {
        return and__3546__auto____3510
      }
    }())) {
      var G__3511 = n__3508 - 1;
      var G__3512 = cljs.core.next.call(null, xs__3509);
      n__3508 = G__3511;
      xs__3509 = G__3512;
      continue
    }else {
      return xs__3509
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__3517 = null;
  var G__3517__3518 = function(coll, n) {
    var temp__3695__auto____3513 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____3513)) {
      var xs__3514 = temp__3695__auto____3513;
      return cljs.core.first.call(null, xs__3514)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__3517__3519 = function(coll, n, not_found) {
    var temp__3695__auto____3515 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____3515)) {
      var xs__3516 = temp__3695__auto____3515;
      return cljs.core.first.call(null, xs__3516)
    }else {
      return not_found
    }
  };
  G__3517 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3517__3518.call(this, coll, n);
      case 3:
        return G__3517__3519.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3517
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___3521 = function() {
    return""
  };
  var str_STAR___3522 = function(x) {
    if(cljs.core.truth_(x === null)) {
      return""
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___3523 = function() {
    var G__3525__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__3526 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__3527 = cljs.core.next.call(null, more);
            sb = G__3526;
            more = G__3527;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__3525 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3525__delegate.call(this, x, ys)
    };
    G__3525.cljs$lang$maxFixedArity = 1;
    G__3525.cljs$lang$applyTo = function(arglist__3528) {
      var x = cljs.core.first(arglist__3528);
      var ys = cljs.core.rest(arglist__3528);
      return G__3525__delegate.call(this, x, ys)
    };
    return G__3525
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___3521.call(this);
      case 1:
        return str_STAR___3522.call(this, x);
      default:
        return str_STAR___3523.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___3523.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__3529 = function() {
    return""
  };
  var str__3530 = function(x) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, x))) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(cljs.core.truth_(x === null)) {
          return""
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__3531 = function() {
    var G__3533__delegate = function(x, ys) {
      return cljs.core.apply.call(null, cljs.core.str_STAR_, x, ys)
    };
    var G__3533 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3533__delegate.call(this, x, ys)
    };
    G__3533.cljs$lang$maxFixedArity = 1;
    G__3533.cljs$lang$applyTo = function(arglist__3534) {
      var x = cljs.core.first(arglist__3534);
      var ys = cljs.core.rest(arglist__3534);
      return G__3533__delegate.call(this, x, ys)
    };
    return G__3533
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__3529.call(this);
      case 1:
        return str__3530.call(this, x);
      default:
        return str__3531.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__3531.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__3535 = function(s, start) {
    return s.substring(start)
  };
  var subs__3536 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__3535.call(this, s, start);
      case 3:
        return subs__3536.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__3538 = function(name) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
      name
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__3539 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__3538.call(this, ns);
      case 2:
        return symbol__3539.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__3541 = function(name) {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
      return name
    }else {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__3542 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__3541.call(this, ns);
      case 2:
        return keyword__3542.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__3544 = cljs.core.seq.call(null, x);
    var ys__3545 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__3544 === null)) {
        return ys__3545 === null
      }else {
        if(cljs.core.truth_(ys__3545 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__3544), cljs.core.first.call(null, ys__3545)))) {
            var G__3546 = cljs.core.next.call(null, xs__3544);
            var G__3547 = cljs.core.next.call(null, ys__3545);
            xs__3544 = G__3546;
            ys__3545 = G__3547;
            continue
          }else {
            if(cljs.core.truth_("\ufdd0'else")) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__3548_SHARP_, p2__3549_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__3548_SHARP_, cljs.core.hash.call(null, p2__3549_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__3550__3551 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__3550__3551)) {
    var G__3553__3555 = cljs.core.first.call(null, G__3550__3551);
    var vec__3554__3556 = G__3553__3555;
    var key_name__3557 = cljs.core.nth.call(null, vec__3554__3556, 0, null);
    var f__3558 = cljs.core.nth.call(null, vec__3554__3556, 1, null);
    var G__3550__3559 = G__3550__3551;
    var G__3553__3560 = G__3553__3555;
    var G__3550__3561 = G__3550__3559;
    while(true) {
      var vec__3562__3563 = G__3553__3560;
      var key_name__3564 = cljs.core.nth.call(null, vec__3562__3563, 0, null);
      var f__3565 = cljs.core.nth.call(null, vec__3562__3563, 1, null);
      var G__3550__3566 = G__3550__3561;
      var str_name__3567 = cljs.core.name.call(null, key_name__3564);
      obj[str_name__3567] = f__3565;
      var temp__3698__auto____3568 = cljs.core.next.call(null, G__3550__3566);
      if(cljs.core.truth_(temp__3698__auto____3568)) {
        var G__3550__3569 = temp__3698__auto____3568;
        var G__3570 = cljs.core.first.call(null, G__3550__3569);
        var G__3571 = G__3550__3569;
        G__3553__3560 = G__3570;
        G__3550__3561 = G__3571;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count
};
cljs.core.List.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3572 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3573 = this;
  return new cljs.core.List(this__3573.meta, o, coll, this__3573.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3574 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3575 = this;
  return this__3575.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3576 = this;
  return this__3576.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3577 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3578 = this;
  return this__3578.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3579 = this;
  return this__3579.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3580 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3581 = this;
  return new cljs.core.List(meta, this__3581.first, this__3581.rest, this__3581.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3582 = this;
  return this__3582.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3583 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta
};
cljs.core.EmptyList.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3584 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3585 = this;
  return new cljs.core.List(this__3585.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3586 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3587 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3588 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3589 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3590 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3591 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3592 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3593 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3594 = this;
  return this__3594.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3595 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__3596) {
    var items = cljs.core.seq(arglist__3596);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest) {
  this.meta = meta;
  this.first = first;
  this.rest = rest
};
cljs.core.Cons.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3597 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3598 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3599 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3600 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3600.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3601 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3602 = this;
  return this__3602.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3603 = this;
  if(cljs.core.truth_(this__3603.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__3603.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3604 = this;
  return this__3604.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3605 = this;
  return new cljs.core.Cons(meta, this__3605.first, this__3605.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__3606 = null;
  var G__3606__3607 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__3606__3608 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__3606 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3606__3607.call(this, string, f);
      case 3:
        return G__3606__3608.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3606
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__3610 = null;
  var G__3610__3611 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__3610__3612 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__3610 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3610__3611.call(this, string, k);
      case 3:
        return G__3610__3612.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3610
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__3614 = null;
  var G__3614__3615 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__3614__3616 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__3614 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3614__3615.call(this, string, n);
      case 3:
        return G__3614__3616.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3614
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__3624 = null;
  var G__3624__3625 = function(tsym3618, coll) {
    var tsym3618__3620 = this;
    var this$__3621 = tsym3618__3620;
    return cljs.core.get.call(null, coll, this$__3621.toString())
  };
  var G__3624__3626 = function(tsym3619, coll, not_found) {
    var tsym3619__3622 = this;
    var this$__3623 = tsym3619__3622;
    return cljs.core.get.call(null, coll, this$__3623.toString(), not_found)
  };
  G__3624 = function(tsym3619, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3624__3625.call(this, tsym3619, coll);
      case 3:
        return G__3624__3626.call(this, tsym3619, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3624
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__3628 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__3628
  }else {
    lazy_seq.x = x__3628.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x) {
  this.meta = meta;
  this.realized = realized;
  this.x = x
};
cljs.core.LazySeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3629 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3630 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3631 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3632 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3632.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3633 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3634 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3635 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3636 = this;
  return this__3636.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3637 = this;
  return new cljs.core.LazySeq(meta, this__3637.realized, this__3637.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__3638 = cljs.core.array.call(null);
  var s__3639 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__3639))) {
      ary__3638.push(cljs.core.first.call(null, s__3639));
      var G__3640 = cljs.core.next.call(null, s__3639);
      s__3639 = G__3640;
      continue
    }else {
      return ary__3638
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__3641 = s;
  var i__3642 = n;
  var sum__3643 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3644 = i__3642 > 0;
      if(cljs.core.truth_(and__3546__auto____3644)) {
        return cljs.core.seq.call(null, s__3641)
      }else {
        return and__3546__auto____3644
      }
    }())) {
      var G__3645 = cljs.core.next.call(null, s__3641);
      var G__3646 = i__3642 - 1;
      var G__3647 = sum__3643 + 1;
      s__3641 = G__3645;
      i__3642 = G__3646;
      sum__3643 = G__3647;
      continue
    }else {
      return sum__3643
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(cljs.core.truth_(arglist === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core.next.call(null, arglist) === null)) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__3651 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__3652 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__3653 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__3648 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__3648)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__3648), concat.call(null, cljs.core.rest.call(null, s__3648), y))
      }else {
        return y
      }
    })
  };
  var concat__3654 = function() {
    var G__3656__delegate = function(x, y, zs) {
      var cat__3650 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__3649 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__3649)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__3649), cat.call(null, cljs.core.rest.call(null, xys__3649), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__3650.call(null, concat.call(null, x, y), zs)
    };
    var G__3656 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3656__delegate.call(this, x, y, zs)
    };
    G__3656.cljs$lang$maxFixedArity = 2;
    G__3656.cljs$lang$applyTo = function(arglist__3657) {
      var x = cljs.core.first(arglist__3657);
      var y = cljs.core.first(cljs.core.next(arglist__3657));
      var zs = cljs.core.rest(cljs.core.next(arglist__3657));
      return G__3656__delegate.call(this, x, y, zs)
    };
    return G__3656
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__3651.call(this);
      case 1:
        return concat__3652.call(this, x);
      case 2:
        return concat__3653.call(this, x, y);
      default:
        return concat__3654.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3654.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___3658 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___3659 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3660 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___3661 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___3662 = function() {
    var G__3664__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__3664 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3664__delegate.call(this, a, b, c, d, more)
    };
    G__3664.cljs$lang$maxFixedArity = 4;
    G__3664.cljs$lang$applyTo = function(arglist__3665) {
      var a = cljs.core.first(arglist__3665);
      var b = cljs.core.first(cljs.core.next(arglist__3665));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3665)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3665))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3665))));
      return G__3664__delegate.call(this, a, b, c, d, more)
    };
    return G__3664
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___3658.call(this, a);
      case 2:
        return list_STAR___3659.call(this, a, b);
      case 3:
        return list_STAR___3660.call(this, a, b, c);
      case 4:
        return list_STAR___3661.call(this, a, b, c, d);
      default:
        return list_STAR___3662.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___3662.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__3675 = function(f, args) {
    var fixed_arity__3666 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__3666 + 1) <= fixed_arity__3666)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3676 = function(f, x, args) {
    var arglist__3667 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__3668 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3667, fixed_arity__3668) <= fixed_arity__3668)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3667))
      }else {
        return f.cljs$lang$applyTo(arglist__3667)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3667))
    }
  };
  var apply__3677 = function(f, x, y, args) {
    var arglist__3669 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__3670 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3669, fixed_arity__3670) <= fixed_arity__3670)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3669))
      }else {
        return f.cljs$lang$applyTo(arglist__3669)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3669))
    }
  };
  var apply__3678 = function(f, x, y, z, args) {
    var arglist__3671 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__3672 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3671, fixed_arity__3672) <= fixed_arity__3672)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3671))
      }else {
        return f.cljs$lang$applyTo(arglist__3671)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3671))
    }
  };
  var apply__3679 = function() {
    var G__3681__delegate = function(f, a, b, c, d, args) {
      var arglist__3673 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__3674 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3673, fixed_arity__3674) <= fixed_arity__3674)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__3673))
        }else {
          return f.cljs$lang$applyTo(arglist__3673)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3673))
      }
    };
    var G__3681 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__3681__delegate.call(this, f, a, b, c, d, args)
    };
    G__3681.cljs$lang$maxFixedArity = 5;
    G__3681.cljs$lang$applyTo = function(arglist__3682) {
      var f = cljs.core.first(arglist__3682);
      var a = cljs.core.first(cljs.core.next(arglist__3682));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3682)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3682))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3682)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3682)))));
      return G__3681__delegate.call(this, f, a, b, c, d, args)
    };
    return G__3681
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__3675.call(this, f, a);
      case 3:
        return apply__3676.call(this, f, a, b);
      case 4:
        return apply__3677.call(this, f, a, b, c);
      case 5:
        return apply__3678.call(this, f, a, b, c, d);
      default:
        return apply__3679.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__3679.cljs$lang$applyTo;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__3683) {
    var obj = cljs.core.first(arglist__3683);
    var f = cljs.core.first(cljs.core.next(arglist__3683));
    var args = cljs.core.rest(cljs.core.next(arglist__3683));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___3684 = function(x) {
    return false
  };
  var not_EQ___3685 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3686 = function() {
    var G__3688__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__3688 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3688__delegate.call(this, x, y, more)
    };
    G__3688.cljs$lang$maxFixedArity = 2;
    G__3688.cljs$lang$applyTo = function(arglist__3689) {
      var x = cljs.core.first(arglist__3689);
      var y = cljs.core.first(cljs.core.next(arglist__3689));
      var more = cljs.core.rest(cljs.core.next(arglist__3689));
      return G__3688__delegate.call(this, x, y, more)
    };
    return G__3688
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___3684.call(this, x);
      case 2:
        return not_EQ___3685.call(this, x, y);
      default:
        return not_EQ___3686.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3686.cljs$lang$applyTo;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll) === null)) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__3690 = pred;
        var G__3691 = cljs.core.next.call(null, coll);
        pred = G__3690;
        coll = G__3691;
        continue
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____3692 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____3692)) {
        return or__3548__auto____3692
      }else {
        var G__3693 = pred;
        var G__3694 = cljs.core.next.call(null, coll);
        pred = G__3693;
        coll = G__3694;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.truth_(cljs.core.integer_QMARK_.call(null, n))) {
    return(n & 1) === 0
  }else {
    throw new Error(cljs.core.str.call(null, "Argument must be an integer: ", n));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__3695 = null;
    var G__3695__3696 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__3695__3697 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__3695__3698 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__3695__3699 = function() {
      var G__3701__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__3701 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__3701__delegate.call(this, x, y, zs)
      };
      G__3701.cljs$lang$maxFixedArity = 2;
      G__3701.cljs$lang$applyTo = function(arglist__3702) {
        var x = cljs.core.first(arglist__3702);
        var y = cljs.core.first(cljs.core.next(arglist__3702));
        var zs = cljs.core.rest(cljs.core.next(arglist__3702));
        return G__3701__delegate.call(this, x, y, zs)
      };
      return G__3701
    }();
    G__3695 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__3695__3696.call(this);
        case 1:
          return G__3695__3697.call(this, x);
        case 2:
          return G__3695__3698.call(this, x, y);
        default:
          return G__3695__3699.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__3695.cljs$lang$maxFixedArity = 2;
    G__3695.cljs$lang$applyTo = G__3695__3699.cljs$lang$applyTo;
    return G__3695
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__3703__delegate = function(args) {
      return x
    };
    var G__3703 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3703__delegate.call(this, args)
    };
    G__3703.cljs$lang$maxFixedArity = 0;
    G__3703.cljs$lang$applyTo = function(arglist__3704) {
      var args = cljs.core.seq(arglist__3704);
      return G__3703__delegate.call(this, args)
    };
    return G__3703
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__3708 = function() {
    return cljs.core.identity
  };
  var comp__3709 = function(f) {
    return f
  };
  var comp__3710 = function(f, g) {
    return function() {
      var G__3714 = null;
      var G__3714__3715 = function() {
        return f.call(null, g.call(null))
      };
      var G__3714__3716 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__3714__3717 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__3714__3718 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__3714__3719 = function() {
        var G__3721__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__3721 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3721__delegate.call(this, x, y, z, args)
        };
        G__3721.cljs$lang$maxFixedArity = 3;
        G__3721.cljs$lang$applyTo = function(arglist__3722) {
          var x = cljs.core.first(arglist__3722);
          var y = cljs.core.first(cljs.core.next(arglist__3722));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3722)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3722)));
          return G__3721__delegate.call(this, x, y, z, args)
        };
        return G__3721
      }();
      G__3714 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3714__3715.call(this);
          case 1:
            return G__3714__3716.call(this, x);
          case 2:
            return G__3714__3717.call(this, x, y);
          case 3:
            return G__3714__3718.call(this, x, y, z);
          default:
            return G__3714__3719.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3714.cljs$lang$maxFixedArity = 3;
      G__3714.cljs$lang$applyTo = G__3714__3719.cljs$lang$applyTo;
      return G__3714
    }()
  };
  var comp__3711 = function(f, g, h) {
    return function() {
      var G__3723 = null;
      var G__3723__3724 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__3723__3725 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__3723__3726 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__3723__3727 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__3723__3728 = function() {
        var G__3730__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__3730 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3730__delegate.call(this, x, y, z, args)
        };
        G__3730.cljs$lang$maxFixedArity = 3;
        G__3730.cljs$lang$applyTo = function(arglist__3731) {
          var x = cljs.core.first(arglist__3731);
          var y = cljs.core.first(cljs.core.next(arglist__3731));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3731)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3731)));
          return G__3730__delegate.call(this, x, y, z, args)
        };
        return G__3730
      }();
      G__3723 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3723__3724.call(this);
          case 1:
            return G__3723__3725.call(this, x);
          case 2:
            return G__3723__3726.call(this, x, y);
          case 3:
            return G__3723__3727.call(this, x, y, z);
          default:
            return G__3723__3728.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3723.cljs$lang$maxFixedArity = 3;
      G__3723.cljs$lang$applyTo = G__3723__3728.cljs$lang$applyTo;
      return G__3723
    }()
  };
  var comp__3712 = function() {
    var G__3732__delegate = function(f1, f2, f3, fs) {
      var fs__3705 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__3733__delegate = function(args) {
          var ret__3706 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__3705), args);
          var fs__3707 = cljs.core.next.call(null, fs__3705);
          while(true) {
            if(cljs.core.truth_(fs__3707)) {
              var G__3734 = cljs.core.first.call(null, fs__3707).call(null, ret__3706);
              var G__3735 = cljs.core.next.call(null, fs__3707);
              ret__3706 = G__3734;
              fs__3707 = G__3735;
              continue
            }else {
              return ret__3706
            }
            break
          }
        };
        var G__3733 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3733__delegate.call(this, args)
        };
        G__3733.cljs$lang$maxFixedArity = 0;
        G__3733.cljs$lang$applyTo = function(arglist__3736) {
          var args = cljs.core.seq(arglist__3736);
          return G__3733__delegate.call(this, args)
        };
        return G__3733
      }()
    };
    var G__3732 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3732__delegate.call(this, f1, f2, f3, fs)
    };
    G__3732.cljs$lang$maxFixedArity = 3;
    G__3732.cljs$lang$applyTo = function(arglist__3737) {
      var f1 = cljs.core.first(arglist__3737);
      var f2 = cljs.core.first(cljs.core.next(arglist__3737));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3737)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3737)));
      return G__3732__delegate.call(this, f1, f2, f3, fs)
    };
    return G__3732
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__3708.call(this);
      case 1:
        return comp__3709.call(this, f1);
      case 2:
        return comp__3710.call(this, f1, f2);
      case 3:
        return comp__3711.call(this, f1, f2, f3);
      default:
        return comp__3712.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__3712.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__3738 = function(f, arg1) {
    return function() {
      var G__3743__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__3743 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3743__delegate.call(this, args)
      };
      G__3743.cljs$lang$maxFixedArity = 0;
      G__3743.cljs$lang$applyTo = function(arglist__3744) {
        var args = cljs.core.seq(arglist__3744);
        return G__3743__delegate.call(this, args)
      };
      return G__3743
    }()
  };
  var partial__3739 = function(f, arg1, arg2) {
    return function() {
      var G__3745__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__3745 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3745__delegate.call(this, args)
      };
      G__3745.cljs$lang$maxFixedArity = 0;
      G__3745.cljs$lang$applyTo = function(arglist__3746) {
        var args = cljs.core.seq(arglist__3746);
        return G__3745__delegate.call(this, args)
      };
      return G__3745
    }()
  };
  var partial__3740 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__3747__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__3747 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3747__delegate.call(this, args)
      };
      G__3747.cljs$lang$maxFixedArity = 0;
      G__3747.cljs$lang$applyTo = function(arglist__3748) {
        var args = cljs.core.seq(arglist__3748);
        return G__3747__delegate.call(this, args)
      };
      return G__3747
    }()
  };
  var partial__3741 = function() {
    var G__3749__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__3750__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__3750 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3750__delegate.call(this, args)
        };
        G__3750.cljs$lang$maxFixedArity = 0;
        G__3750.cljs$lang$applyTo = function(arglist__3751) {
          var args = cljs.core.seq(arglist__3751);
          return G__3750__delegate.call(this, args)
        };
        return G__3750
      }()
    };
    var G__3749 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3749__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__3749.cljs$lang$maxFixedArity = 4;
    G__3749.cljs$lang$applyTo = function(arglist__3752) {
      var f = cljs.core.first(arglist__3752);
      var arg1 = cljs.core.first(cljs.core.next(arglist__3752));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3752)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3752))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3752))));
      return G__3749__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__3749
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__3738.call(this, f, arg1);
      case 3:
        return partial__3739.call(this, f, arg1, arg2);
      case 4:
        return partial__3740.call(this, f, arg1, arg2, arg3);
      default:
        return partial__3741.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__3741.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__3753 = function(f, x) {
    return function() {
      var G__3757 = null;
      var G__3757__3758 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__3757__3759 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__3757__3760 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__3757__3761 = function() {
        var G__3763__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__3763 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3763__delegate.call(this, a, b, c, ds)
        };
        G__3763.cljs$lang$maxFixedArity = 3;
        G__3763.cljs$lang$applyTo = function(arglist__3764) {
          var a = cljs.core.first(arglist__3764);
          var b = cljs.core.first(cljs.core.next(arglist__3764));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3764)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3764)));
          return G__3763__delegate.call(this, a, b, c, ds)
        };
        return G__3763
      }();
      G__3757 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__3757__3758.call(this, a);
          case 2:
            return G__3757__3759.call(this, a, b);
          case 3:
            return G__3757__3760.call(this, a, b, c);
          default:
            return G__3757__3761.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3757.cljs$lang$maxFixedArity = 3;
      G__3757.cljs$lang$applyTo = G__3757__3761.cljs$lang$applyTo;
      return G__3757
    }()
  };
  var fnil__3754 = function(f, x, y) {
    return function() {
      var G__3765 = null;
      var G__3765__3766 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__3765__3767 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__3765__3768 = function() {
        var G__3770__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__3770 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3770__delegate.call(this, a, b, c, ds)
        };
        G__3770.cljs$lang$maxFixedArity = 3;
        G__3770.cljs$lang$applyTo = function(arglist__3771) {
          var a = cljs.core.first(arglist__3771);
          var b = cljs.core.first(cljs.core.next(arglist__3771));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3771)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3771)));
          return G__3770__delegate.call(this, a, b, c, ds)
        };
        return G__3770
      }();
      G__3765 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3765__3766.call(this, a, b);
          case 3:
            return G__3765__3767.call(this, a, b, c);
          default:
            return G__3765__3768.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3765.cljs$lang$maxFixedArity = 3;
      G__3765.cljs$lang$applyTo = G__3765__3768.cljs$lang$applyTo;
      return G__3765
    }()
  };
  var fnil__3755 = function(f, x, y, z) {
    return function() {
      var G__3772 = null;
      var G__3772__3773 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__3772__3774 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__3772__3775 = function() {
        var G__3777__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__3777 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3777__delegate.call(this, a, b, c, ds)
        };
        G__3777.cljs$lang$maxFixedArity = 3;
        G__3777.cljs$lang$applyTo = function(arglist__3778) {
          var a = cljs.core.first(arglist__3778);
          var b = cljs.core.first(cljs.core.next(arglist__3778));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3778)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3778)));
          return G__3777__delegate.call(this, a, b, c, ds)
        };
        return G__3777
      }();
      G__3772 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3772__3773.call(this, a, b);
          case 3:
            return G__3772__3774.call(this, a, b, c);
          default:
            return G__3772__3775.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3772.cljs$lang$maxFixedArity = 3;
      G__3772.cljs$lang$applyTo = G__3772__3775.cljs$lang$applyTo;
      return G__3772
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__3753.call(this, f, x);
      case 3:
        return fnil__3754.call(this, f, x, y);
      case 4:
        return fnil__3755.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__3781 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____3779 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3779)) {
        var s__3780 = temp__3698__auto____3779;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__3780)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__3780)))
      }else {
        return null
      }
    })
  };
  return mapi__3781.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____3782 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____3782)) {
      var s__3783 = temp__3698__auto____3782;
      var x__3784 = f.call(null, cljs.core.first.call(null, s__3783));
      if(cljs.core.truth_(x__3784 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__3783))
      }else {
        return cljs.core.cons.call(null, x__3784, keep.call(null, f, cljs.core.rest.call(null, s__3783)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__3794 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____3791 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3791)) {
        var s__3792 = temp__3698__auto____3791;
        var x__3793 = f.call(null, idx, cljs.core.first.call(null, s__3792));
        if(cljs.core.truth_(x__3793 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__3792))
        }else {
          return cljs.core.cons.call(null, x__3793, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__3792)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__3794.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__3839 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__3844 = function() {
        return true
      };
      var ep1__3845 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__3846 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3801 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3801)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____3801
          }
        }())
      };
      var ep1__3847 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3802 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3802)) {
            var and__3546__auto____3803 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____3803)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____3803
            }
          }else {
            return and__3546__auto____3802
          }
        }())
      };
      var ep1__3848 = function() {
        var G__3850__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____3804 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____3804)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____3804
            }
          }())
        };
        var G__3850 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3850__delegate.call(this, x, y, z, args)
        };
        G__3850.cljs$lang$maxFixedArity = 3;
        G__3850.cljs$lang$applyTo = function(arglist__3851) {
          var x = cljs.core.first(arglist__3851);
          var y = cljs.core.first(cljs.core.next(arglist__3851));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3851)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3851)));
          return G__3850__delegate.call(this, x, y, z, args)
        };
        return G__3850
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__3844.call(this);
          case 1:
            return ep1__3845.call(this, x);
          case 2:
            return ep1__3846.call(this, x, y);
          case 3:
            return ep1__3847.call(this, x, y, z);
          default:
            return ep1__3848.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__3848.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__3840 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__3852 = function() {
        return true
      };
      var ep2__3853 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3805 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3805)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____3805
          }
        }())
      };
      var ep2__3854 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3806 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3806)) {
            var and__3546__auto____3807 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____3807)) {
              var and__3546__auto____3808 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____3808)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____3808
              }
            }else {
              return and__3546__auto____3807
            }
          }else {
            return and__3546__auto____3806
          }
        }())
      };
      var ep2__3855 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3809 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3809)) {
            var and__3546__auto____3810 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____3810)) {
              var and__3546__auto____3811 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____3811)) {
                var and__3546__auto____3812 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____3812)) {
                  var and__3546__auto____3813 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____3813)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____3813
                  }
                }else {
                  return and__3546__auto____3812
                }
              }else {
                return and__3546__auto____3811
              }
            }else {
              return and__3546__auto____3810
            }
          }else {
            return and__3546__auto____3809
          }
        }())
      };
      var ep2__3856 = function() {
        var G__3858__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____3814 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____3814)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3785_SHARP_) {
                var and__3546__auto____3815 = p1.call(null, p1__3785_SHARP_);
                if(cljs.core.truth_(and__3546__auto____3815)) {
                  return p2.call(null, p1__3785_SHARP_)
                }else {
                  return and__3546__auto____3815
                }
              }, args)
            }else {
              return and__3546__auto____3814
            }
          }())
        };
        var G__3858 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3858__delegate.call(this, x, y, z, args)
        };
        G__3858.cljs$lang$maxFixedArity = 3;
        G__3858.cljs$lang$applyTo = function(arglist__3859) {
          var x = cljs.core.first(arglist__3859);
          var y = cljs.core.first(cljs.core.next(arglist__3859));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3859)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3859)));
          return G__3858__delegate.call(this, x, y, z, args)
        };
        return G__3858
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__3852.call(this);
          case 1:
            return ep2__3853.call(this, x);
          case 2:
            return ep2__3854.call(this, x, y);
          case 3:
            return ep2__3855.call(this, x, y, z);
          default:
            return ep2__3856.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__3856.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__3841 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__3860 = function() {
        return true
      };
      var ep3__3861 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3816 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3816)) {
            var and__3546__auto____3817 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3817)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____3817
            }
          }else {
            return and__3546__auto____3816
          }
        }())
      };
      var ep3__3862 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3818 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3818)) {
            var and__3546__auto____3819 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3819)) {
              var and__3546__auto____3820 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____3820)) {
                var and__3546__auto____3821 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____3821)) {
                  var and__3546__auto____3822 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____3822)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____3822
                  }
                }else {
                  return and__3546__auto____3821
                }
              }else {
                return and__3546__auto____3820
              }
            }else {
              return and__3546__auto____3819
            }
          }else {
            return and__3546__auto____3818
          }
        }())
      };
      var ep3__3863 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3823 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3823)) {
            var and__3546__auto____3824 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3824)) {
              var and__3546__auto____3825 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____3825)) {
                var and__3546__auto____3826 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____3826)) {
                  var and__3546__auto____3827 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____3827)) {
                    var and__3546__auto____3828 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____3828)) {
                      var and__3546__auto____3829 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____3829)) {
                        var and__3546__auto____3830 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____3830)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____3830
                        }
                      }else {
                        return and__3546__auto____3829
                      }
                    }else {
                      return and__3546__auto____3828
                    }
                  }else {
                    return and__3546__auto____3827
                  }
                }else {
                  return and__3546__auto____3826
                }
              }else {
                return and__3546__auto____3825
              }
            }else {
              return and__3546__auto____3824
            }
          }else {
            return and__3546__auto____3823
          }
        }())
      };
      var ep3__3864 = function() {
        var G__3866__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____3831 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____3831)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3786_SHARP_) {
                var and__3546__auto____3832 = p1.call(null, p1__3786_SHARP_);
                if(cljs.core.truth_(and__3546__auto____3832)) {
                  var and__3546__auto____3833 = p2.call(null, p1__3786_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____3833)) {
                    return p3.call(null, p1__3786_SHARP_)
                  }else {
                    return and__3546__auto____3833
                  }
                }else {
                  return and__3546__auto____3832
                }
              }, args)
            }else {
              return and__3546__auto____3831
            }
          }())
        };
        var G__3866 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3866__delegate.call(this, x, y, z, args)
        };
        G__3866.cljs$lang$maxFixedArity = 3;
        G__3866.cljs$lang$applyTo = function(arglist__3867) {
          var x = cljs.core.first(arglist__3867);
          var y = cljs.core.first(cljs.core.next(arglist__3867));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3867)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3867)));
          return G__3866__delegate.call(this, x, y, z, args)
        };
        return G__3866
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__3860.call(this);
          case 1:
            return ep3__3861.call(this, x);
          case 2:
            return ep3__3862.call(this, x, y);
          case 3:
            return ep3__3863.call(this, x, y, z);
          default:
            return ep3__3864.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__3864.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__3842 = function() {
    var G__3868__delegate = function(p1, p2, p3, ps) {
      var ps__3834 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__3869 = function() {
          return true
        };
        var epn__3870 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__3787_SHARP_) {
            return p1__3787_SHARP_.call(null, x)
          }, ps__3834)
        };
        var epn__3871 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__3788_SHARP_) {
            var and__3546__auto____3835 = p1__3788_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3835)) {
              return p1__3788_SHARP_.call(null, y)
            }else {
              return and__3546__auto____3835
            }
          }, ps__3834)
        };
        var epn__3872 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__3789_SHARP_) {
            var and__3546__auto____3836 = p1__3789_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3836)) {
              var and__3546__auto____3837 = p1__3789_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____3837)) {
                return p1__3789_SHARP_.call(null, z)
              }else {
                return and__3546__auto____3837
              }
            }else {
              return and__3546__auto____3836
            }
          }, ps__3834)
        };
        var epn__3873 = function() {
          var G__3875__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____3838 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____3838)) {
                return cljs.core.every_QMARK_.call(null, function(p1__3790_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__3790_SHARP_, args)
                }, ps__3834)
              }else {
                return and__3546__auto____3838
              }
            }())
          };
          var G__3875 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3875__delegate.call(this, x, y, z, args)
          };
          G__3875.cljs$lang$maxFixedArity = 3;
          G__3875.cljs$lang$applyTo = function(arglist__3876) {
            var x = cljs.core.first(arglist__3876);
            var y = cljs.core.first(cljs.core.next(arglist__3876));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3876)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3876)));
            return G__3875__delegate.call(this, x, y, z, args)
          };
          return G__3875
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__3869.call(this);
            case 1:
              return epn__3870.call(this, x);
            case 2:
              return epn__3871.call(this, x, y);
            case 3:
              return epn__3872.call(this, x, y, z);
            default:
              return epn__3873.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__3873.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__3868 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3868__delegate.call(this, p1, p2, p3, ps)
    };
    G__3868.cljs$lang$maxFixedArity = 3;
    G__3868.cljs$lang$applyTo = function(arglist__3877) {
      var p1 = cljs.core.first(arglist__3877);
      var p2 = cljs.core.first(cljs.core.next(arglist__3877));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3877)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3877)));
      return G__3868__delegate.call(this, p1, p2, p3, ps)
    };
    return G__3868
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__3839.call(this, p1);
      case 2:
        return every_pred__3840.call(this, p1, p2);
      case 3:
        return every_pred__3841.call(this, p1, p2, p3);
      default:
        return every_pred__3842.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__3842.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__3917 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__3922 = function() {
        return null
      };
      var sp1__3923 = function(x) {
        return p.call(null, x)
      };
      var sp1__3924 = function(x, y) {
        var or__3548__auto____3879 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3879)) {
          return or__3548__auto____3879
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3925 = function(x, y, z) {
        var or__3548__auto____3880 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3880)) {
          return or__3548__auto____3880
        }else {
          var or__3548__auto____3881 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____3881)) {
            return or__3548__auto____3881
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__3926 = function() {
        var G__3928__delegate = function(x, y, z, args) {
          var or__3548__auto____3882 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____3882)) {
            return or__3548__auto____3882
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__3928 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3928__delegate.call(this, x, y, z, args)
        };
        G__3928.cljs$lang$maxFixedArity = 3;
        G__3928.cljs$lang$applyTo = function(arglist__3929) {
          var x = cljs.core.first(arglist__3929);
          var y = cljs.core.first(cljs.core.next(arglist__3929));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3929)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3929)));
          return G__3928__delegate.call(this, x, y, z, args)
        };
        return G__3928
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__3922.call(this);
          case 1:
            return sp1__3923.call(this, x);
          case 2:
            return sp1__3924.call(this, x, y);
          case 3:
            return sp1__3925.call(this, x, y, z);
          default:
            return sp1__3926.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__3926.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__3918 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__3930 = function() {
        return null
      };
      var sp2__3931 = function(x) {
        var or__3548__auto____3883 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3883)) {
          return or__3548__auto____3883
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__3932 = function(x, y) {
        var or__3548__auto____3884 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3884)) {
          return or__3548__auto____3884
        }else {
          var or__3548__auto____3885 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____3885)) {
            return or__3548__auto____3885
          }else {
            var or__3548__auto____3886 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____3886)) {
              return or__3548__auto____3886
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3933 = function(x, y, z) {
        var or__3548__auto____3887 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3887)) {
          return or__3548__auto____3887
        }else {
          var or__3548__auto____3888 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____3888)) {
            return or__3548__auto____3888
          }else {
            var or__3548__auto____3889 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____3889)) {
              return or__3548__auto____3889
            }else {
              var or__3548__auto____3890 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____3890)) {
                return or__3548__auto____3890
              }else {
                var or__3548__auto____3891 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____3891)) {
                  return or__3548__auto____3891
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__3934 = function() {
        var G__3936__delegate = function(x, y, z, args) {
          var or__3548__auto____3892 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____3892)) {
            return or__3548__auto____3892
          }else {
            return cljs.core.some.call(null, function(p1__3795_SHARP_) {
              var or__3548__auto____3893 = p1.call(null, p1__3795_SHARP_);
              if(cljs.core.truth_(or__3548__auto____3893)) {
                return or__3548__auto____3893
              }else {
                return p2.call(null, p1__3795_SHARP_)
              }
            }, args)
          }
        };
        var G__3936 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3936__delegate.call(this, x, y, z, args)
        };
        G__3936.cljs$lang$maxFixedArity = 3;
        G__3936.cljs$lang$applyTo = function(arglist__3937) {
          var x = cljs.core.first(arglist__3937);
          var y = cljs.core.first(cljs.core.next(arglist__3937));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3937)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3937)));
          return G__3936__delegate.call(this, x, y, z, args)
        };
        return G__3936
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__3930.call(this);
          case 1:
            return sp2__3931.call(this, x);
          case 2:
            return sp2__3932.call(this, x, y);
          case 3:
            return sp2__3933.call(this, x, y, z);
          default:
            return sp2__3934.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__3934.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__3919 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__3938 = function() {
        return null
      };
      var sp3__3939 = function(x) {
        var or__3548__auto____3894 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3894)) {
          return or__3548__auto____3894
        }else {
          var or__3548__auto____3895 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____3895)) {
            return or__3548__auto____3895
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__3940 = function(x, y) {
        var or__3548__auto____3896 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3896)) {
          return or__3548__auto____3896
        }else {
          var or__3548__auto____3897 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____3897)) {
            return or__3548__auto____3897
          }else {
            var or__3548__auto____3898 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____3898)) {
              return or__3548__auto____3898
            }else {
              var or__3548__auto____3899 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____3899)) {
                return or__3548__auto____3899
              }else {
                var or__3548__auto____3900 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____3900)) {
                  return or__3548__auto____3900
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3941 = function(x, y, z) {
        var or__3548__auto____3901 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3901)) {
          return or__3548__auto____3901
        }else {
          var or__3548__auto____3902 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____3902)) {
            return or__3548__auto____3902
          }else {
            var or__3548__auto____3903 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____3903)) {
              return or__3548__auto____3903
            }else {
              var or__3548__auto____3904 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____3904)) {
                return or__3548__auto____3904
              }else {
                var or__3548__auto____3905 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____3905)) {
                  return or__3548__auto____3905
                }else {
                  var or__3548__auto____3906 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____3906)) {
                    return or__3548__auto____3906
                  }else {
                    var or__3548__auto____3907 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____3907)) {
                      return or__3548__auto____3907
                    }else {
                      var or__3548__auto____3908 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____3908)) {
                        return or__3548__auto____3908
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__3942 = function() {
        var G__3944__delegate = function(x, y, z, args) {
          var or__3548__auto____3909 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____3909)) {
            return or__3548__auto____3909
          }else {
            return cljs.core.some.call(null, function(p1__3796_SHARP_) {
              var or__3548__auto____3910 = p1.call(null, p1__3796_SHARP_);
              if(cljs.core.truth_(or__3548__auto____3910)) {
                return or__3548__auto____3910
              }else {
                var or__3548__auto____3911 = p2.call(null, p1__3796_SHARP_);
                if(cljs.core.truth_(or__3548__auto____3911)) {
                  return or__3548__auto____3911
                }else {
                  return p3.call(null, p1__3796_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__3944 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3944__delegate.call(this, x, y, z, args)
        };
        G__3944.cljs$lang$maxFixedArity = 3;
        G__3944.cljs$lang$applyTo = function(arglist__3945) {
          var x = cljs.core.first(arglist__3945);
          var y = cljs.core.first(cljs.core.next(arglist__3945));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3945)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3945)));
          return G__3944__delegate.call(this, x, y, z, args)
        };
        return G__3944
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__3938.call(this);
          case 1:
            return sp3__3939.call(this, x);
          case 2:
            return sp3__3940.call(this, x, y);
          case 3:
            return sp3__3941.call(this, x, y, z);
          default:
            return sp3__3942.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__3942.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__3920 = function() {
    var G__3946__delegate = function(p1, p2, p3, ps) {
      var ps__3912 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__3947 = function() {
          return null
        };
        var spn__3948 = function(x) {
          return cljs.core.some.call(null, function(p1__3797_SHARP_) {
            return p1__3797_SHARP_.call(null, x)
          }, ps__3912)
        };
        var spn__3949 = function(x, y) {
          return cljs.core.some.call(null, function(p1__3798_SHARP_) {
            var or__3548__auto____3913 = p1__3798_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____3913)) {
              return or__3548__auto____3913
            }else {
              return p1__3798_SHARP_.call(null, y)
            }
          }, ps__3912)
        };
        var spn__3950 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__3799_SHARP_) {
            var or__3548__auto____3914 = p1__3799_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____3914)) {
              return or__3548__auto____3914
            }else {
              var or__3548__auto____3915 = p1__3799_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____3915)) {
                return or__3548__auto____3915
              }else {
                return p1__3799_SHARP_.call(null, z)
              }
            }
          }, ps__3912)
        };
        var spn__3951 = function() {
          var G__3953__delegate = function(x, y, z, args) {
            var or__3548__auto____3916 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____3916)) {
              return or__3548__auto____3916
            }else {
              return cljs.core.some.call(null, function(p1__3800_SHARP_) {
                return cljs.core.some.call(null, p1__3800_SHARP_, args)
              }, ps__3912)
            }
          };
          var G__3953 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3953__delegate.call(this, x, y, z, args)
          };
          G__3953.cljs$lang$maxFixedArity = 3;
          G__3953.cljs$lang$applyTo = function(arglist__3954) {
            var x = cljs.core.first(arglist__3954);
            var y = cljs.core.first(cljs.core.next(arglist__3954));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3954)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3954)));
            return G__3953__delegate.call(this, x, y, z, args)
          };
          return G__3953
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__3947.call(this);
            case 1:
              return spn__3948.call(this, x);
            case 2:
              return spn__3949.call(this, x, y);
            case 3:
              return spn__3950.call(this, x, y, z);
            default:
              return spn__3951.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__3951.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__3946 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3946__delegate.call(this, p1, p2, p3, ps)
    };
    G__3946.cljs$lang$maxFixedArity = 3;
    G__3946.cljs$lang$applyTo = function(arglist__3955) {
      var p1 = cljs.core.first(arglist__3955);
      var p2 = cljs.core.first(cljs.core.next(arglist__3955));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3955)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3955)));
      return G__3946__delegate.call(this, p1, p2, p3, ps)
    };
    return G__3946
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__3917.call(this, p1);
      case 2:
        return some_fn__3918.call(this, p1, p2);
      case 3:
        return some_fn__3919.call(this, p1, p2, p3);
      default:
        return some_fn__3920.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__3920.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__3968 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____3956 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3956)) {
        var s__3957 = temp__3698__auto____3956;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__3957)), map.call(null, f, cljs.core.rest.call(null, s__3957)))
      }else {
        return null
      }
    })
  };
  var map__3969 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__3958 = cljs.core.seq.call(null, c1);
      var s2__3959 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____3960 = s1__3958;
        if(cljs.core.truth_(and__3546__auto____3960)) {
          return s2__3959
        }else {
          return and__3546__auto____3960
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__3958), cljs.core.first.call(null, s2__3959)), map.call(null, f, cljs.core.rest.call(null, s1__3958), cljs.core.rest.call(null, s2__3959)))
      }else {
        return null
      }
    })
  };
  var map__3970 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__3961 = cljs.core.seq.call(null, c1);
      var s2__3962 = cljs.core.seq.call(null, c2);
      var s3__3963 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____3964 = s1__3961;
        if(cljs.core.truth_(and__3546__auto____3964)) {
          var and__3546__auto____3965 = s2__3962;
          if(cljs.core.truth_(and__3546__auto____3965)) {
            return s3__3963
          }else {
            return and__3546__auto____3965
          }
        }else {
          return and__3546__auto____3964
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__3961), cljs.core.first.call(null, s2__3962), cljs.core.first.call(null, s3__3963)), map.call(null, f, cljs.core.rest.call(null, s1__3961), cljs.core.rest.call(null, s2__3962), cljs.core.rest.call(null, s3__3963)))
      }else {
        return null
      }
    })
  };
  var map__3971 = function() {
    var G__3973__delegate = function(f, c1, c2, c3, colls) {
      var step__3967 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__3966 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__3966))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__3966), step.call(null, map.call(null, cljs.core.rest, ss__3966)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__3878_SHARP_) {
        return cljs.core.apply.call(null, f, p1__3878_SHARP_)
      }, step__3967.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__3973 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3973__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__3973.cljs$lang$maxFixedArity = 4;
    G__3973.cljs$lang$applyTo = function(arglist__3974) {
      var f = cljs.core.first(arglist__3974);
      var c1 = cljs.core.first(cljs.core.next(arglist__3974));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3974)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3974))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3974))));
      return G__3973__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__3973
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__3968.call(this, f, c1);
      case 3:
        return map__3969.call(this, f, c1, c2);
      case 4:
        return map__3970.call(this, f, c1, c2, c3);
      default:
        return map__3971.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__3971.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____3975 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3975)) {
        var s__3976 = temp__3698__auto____3975;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__3976), take.call(null, n - 1, cljs.core.rest.call(null, s__3976)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__3979 = function(n, coll) {
    while(true) {
      var s__3977 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____3978 = n > 0;
        if(cljs.core.truth_(and__3546__auto____3978)) {
          return s__3977
        }else {
          return and__3546__auto____3978
        }
      }())) {
        var G__3980 = n - 1;
        var G__3981 = cljs.core.rest.call(null, s__3977);
        n = G__3980;
        coll = G__3981;
        continue
      }else {
        return s__3977
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__3979.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__3982 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__3983 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__3982.call(this, n);
      case 2:
        return drop_last__3983.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__3985 = cljs.core.seq.call(null, coll);
  var lead__3986 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__3986)) {
      var G__3987 = cljs.core.next.call(null, s__3985);
      var G__3988 = cljs.core.next.call(null, lead__3986);
      s__3985 = G__3987;
      lead__3986 = G__3988;
      continue
    }else {
      return s__3985
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__3991 = function(pred, coll) {
    while(true) {
      var s__3989 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____3990 = s__3989;
        if(cljs.core.truth_(and__3546__auto____3990)) {
          return pred.call(null, cljs.core.first.call(null, s__3989))
        }else {
          return and__3546__auto____3990
        }
      }())) {
        var G__3992 = pred;
        var G__3993 = cljs.core.rest.call(null, s__3989);
        pred = G__3992;
        coll = G__3993;
        continue
      }else {
        return s__3989
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__3991.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____3994 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____3994)) {
      var s__3995 = temp__3698__auto____3994;
      return cljs.core.concat.call(null, s__3995, cycle.call(null, s__3995))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__3996 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__3997 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__3996.call(this, n);
      case 2:
        return repeat__3997.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__3999 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__4000 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__3999.call(this, n);
      case 2:
        return repeatedly__4000.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__4006 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__4002 = cljs.core.seq.call(null, c1);
      var s2__4003 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4004 = s1__4002;
        if(cljs.core.truth_(and__3546__auto____4004)) {
          return s2__4003
        }else {
          return and__3546__auto____4004
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__4002), cljs.core.cons.call(null, cljs.core.first.call(null, s2__4003), interleave.call(null, cljs.core.rest.call(null, s1__4002), cljs.core.rest.call(null, s2__4003))))
      }else {
        return null
      }
    })
  };
  var interleave__4007 = function() {
    var G__4009__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__4005 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__4005))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__4005), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__4005)))
        }else {
          return null
        }
      })
    };
    var G__4009 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4009__delegate.call(this, c1, c2, colls)
    };
    G__4009.cljs$lang$maxFixedArity = 2;
    G__4009.cljs$lang$applyTo = function(arglist__4010) {
      var c1 = cljs.core.first(arglist__4010);
      var c2 = cljs.core.first(cljs.core.next(arglist__4010));
      var colls = cljs.core.rest(cljs.core.next(arglist__4010));
      return G__4009__delegate.call(this, c1, c2, colls)
    };
    return G__4009
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__4006.call(this, c1, c2);
      default:
        return interleave__4007.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__4007.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__4013 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____4011 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____4011)) {
        var coll__4012 = temp__3695__auto____4011;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__4012), cat.call(null, cljs.core.rest.call(null, coll__4012), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__4013.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__4014 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__4015 = function() {
    var G__4017__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__4017 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4017__delegate.call(this, f, coll, colls)
    };
    G__4017.cljs$lang$maxFixedArity = 2;
    G__4017.cljs$lang$applyTo = function(arglist__4018) {
      var f = cljs.core.first(arglist__4018);
      var coll = cljs.core.first(cljs.core.next(arglist__4018));
      var colls = cljs.core.rest(cljs.core.next(arglist__4018));
      return G__4017__delegate.call(this, f, coll, colls)
    };
    return G__4017
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__4014.call(this, f, coll);
      default:
        return mapcat__4015.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__4015.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4019 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4019)) {
      var s__4020 = temp__3698__auto____4019;
      var f__4021 = cljs.core.first.call(null, s__4020);
      var r__4022 = cljs.core.rest.call(null, s__4020);
      if(cljs.core.truth_(pred.call(null, f__4021))) {
        return cljs.core.cons.call(null, f__4021, filter.call(null, pred, r__4022))
      }else {
        return filter.call(null, pred, r__4022)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__4024 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__4024.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__4023_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__4023_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__4031 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__4032 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4025 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4025)) {
        var s__4026 = temp__3698__auto____4025;
        var p__4027 = cljs.core.take.call(null, n, s__4026);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__4027)))) {
          return cljs.core.cons.call(null, p__4027, partition.call(null, n, step, cljs.core.drop.call(null, step, s__4026)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4033 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4028 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4028)) {
        var s__4029 = temp__3698__auto____4028;
        var p__4030 = cljs.core.take.call(null, n, s__4029);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__4030)))) {
          return cljs.core.cons.call(null, p__4030, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__4029)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__4030, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__4031.call(this, n, step);
      case 3:
        return partition__4032.call(this, n, step, pad);
      case 4:
        return partition__4033.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__4039 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__4040 = function(m, ks, not_found) {
    var sentinel__4035 = cljs.core.lookup_sentinel;
    var m__4036 = m;
    var ks__4037 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__4037)) {
        var m__4038 = cljs.core.get.call(null, m__4036, cljs.core.first.call(null, ks__4037), sentinel__4035);
        if(cljs.core.truth_(sentinel__4035 === m__4038)) {
          return not_found
        }else {
          var G__4042 = sentinel__4035;
          var G__4043 = m__4038;
          var G__4044 = cljs.core.next.call(null, ks__4037);
          sentinel__4035 = G__4042;
          m__4036 = G__4043;
          ks__4037 = G__4044;
          continue
        }
      }else {
        return m__4036
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__4039.call(this, m, ks);
      case 3:
        return get_in__4040.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__4045, v) {
  var vec__4046__4047 = p__4045;
  var k__4048 = cljs.core.nth.call(null, vec__4046__4047, 0, null);
  var ks__4049 = cljs.core.nthnext.call(null, vec__4046__4047, 1);
  if(cljs.core.truth_(ks__4049)) {
    return cljs.core.assoc.call(null, m, k__4048, assoc_in.call(null, cljs.core.get.call(null, m, k__4048), ks__4049, v))
  }else {
    return cljs.core.assoc.call(null, m, k__4048, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__4050, f, args) {
    var vec__4051__4052 = p__4050;
    var k__4053 = cljs.core.nth.call(null, vec__4051__4052, 0, null);
    var ks__4054 = cljs.core.nthnext.call(null, vec__4051__4052, 1);
    if(cljs.core.truth_(ks__4054)) {
      return cljs.core.assoc.call(null, m, k__4053, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__4053), ks__4054, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__4053, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__4053), args))
    }
  };
  var update_in = function(m, p__4050, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__4050, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__4055) {
    var m = cljs.core.first(arglist__4055);
    var p__4050 = cljs.core.first(cljs.core.next(arglist__4055));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4055)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4055)));
    return update_in__delegate.call(this, m, p__4050, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array) {
  this.meta = meta;
  this.array = array
};
cljs.core.Vector.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4056 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4089 = null;
  var G__4089__4090 = function(coll, k) {
    var this__4057 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__4089__4091 = function(coll, k, not_found) {
    var this__4058 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__4089 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4089__4090.call(this, coll, k);
      case 3:
        return G__4089__4091.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4089
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4059 = this;
  var new_array__4060 = cljs.core.aclone.call(null, this__4059.array);
  new_array__4060[k] = v;
  return new cljs.core.Vector(this__4059.meta, new_array__4060)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__4093 = null;
  var G__4093__4094 = function(tsym4061, k) {
    var this__4063 = this;
    var tsym4061__4064 = this;
    var coll__4065 = tsym4061__4064;
    return cljs.core._lookup.call(null, coll__4065, k)
  };
  var G__4093__4095 = function(tsym4062, k, not_found) {
    var this__4066 = this;
    var tsym4062__4067 = this;
    var coll__4068 = tsym4062__4067;
    return cljs.core._lookup.call(null, coll__4068, k, not_found)
  };
  G__4093 = function(tsym4062, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4093__4094.call(this, tsym4062, k);
      case 3:
        return G__4093__4095.call(this, tsym4062, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4093
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4069 = this;
  var new_array__4070 = cljs.core.aclone.call(null, this__4069.array);
  new_array__4070.push(o);
  return new cljs.core.Vector(this__4069.meta, new_array__4070)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4097 = null;
  var G__4097__4098 = function(v, f) {
    var this__4071 = this;
    return cljs.core.ci_reduce.call(null, this__4071.array, f)
  };
  var G__4097__4099 = function(v, f, start) {
    var this__4072 = this;
    return cljs.core.ci_reduce.call(null, this__4072.array, f, start)
  };
  G__4097 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4097__4098.call(this, v, f);
      case 3:
        return G__4097__4099.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4097
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4073 = this;
  if(cljs.core.truth_(this__4073.array.length > 0)) {
    var vector_seq__4074 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__4073.array.length)) {
          return cljs.core.cons.call(null, this__4073.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__4074.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4075 = this;
  return this__4075.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4076 = this;
  var count__4077 = this__4076.array.length;
  if(cljs.core.truth_(count__4077 > 0)) {
    return this__4076.array[count__4077 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4078 = this;
  if(cljs.core.truth_(this__4078.array.length > 0)) {
    var new_array__4079 = cljs.core.aclone.call(null, this__4078.array);
    new_array__4079.pop();
    return new cljs.core.Vector(this__4078.meta, new_array__4079)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__4080 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4081 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4082 = this;
  return new cljs.core.Vector(meta, this__4082.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4083 = this;
  return this__4083.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4101 = null;
  var G__4101__4102 = function(coll, n) {
    var this__4084 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____4085 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____4085)) {
        return n < this__4084.array.length
      }else {
        return and__3546__auto____4085
      }
    }())) {
      return this__4084.array[n]
    }else {
      return null
    }
  };
  var G__4101__4103 = function(coll, n, not_found) {
    var this__4086 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____4087 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____4087)) {
        return n < this__4086.array.length
      }else {
        return and__3546__auto____4087
      }
    }())) {
      return this__4086.array[n]
    }else {
      return not_found
    }
  };
  G__4101 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4101__4102.call(this, coll, n);
      case 3:
        return G__4101__4103.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4101
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4088 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__4088.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, cljs.core.array.call(null));
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.Vector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__4105) {
    var args = cljs.core.seq(arglist__4105);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end
};
cljs.core.Subvec.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4106 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4134 = null;
  var G__4134__4135 = function(coll, k) {
    var this__4107 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__4134__4136 = function(coll, k, not_found) {
    var this__4108 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__4134 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4134__4135.call(this, coll, k);
      case 3:
        return G__4134__4136.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4134
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__4109 = this;
  var v_pos__4110 = this__4109.start + key;
  return new cljs.core.Subvec(this__4109.meta, cljs.core._assoc.call(null, this__4109.v, v_pos__4110, val), this__4109.start, this__4109.end > v_pos__4110 + 1 ? this__4109.end : v_pos__4110 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__4138 = null;
  var G__4138__4139 = function(tsym4111, k) {
    var this__4113 = this;
    var tsym4111__4114 = this;
    var coll__4115 = tsym4111__4114;
    return cljs.core._lookup.call(null, coll__4115, k)
  };
  var G__4138__4140 = function(tsym4112, k, not_found) {
    var this__4116 = this;
    var tsym4112__4117 = this;
    var coll__4118 = tsym4112__4117;
    return cljs.core._lookup.call(null, coll__4118, k, not_found)
  };
  G__4138 = function(tsym4112, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4138__4139.call(this, tsym4112, k);
      case 3:
        return G__4138__4140.call(this, tsym4112, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4138
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4119 = this;
  return new cljs.core.Subvec(this__4119.meta, cljs.core._assoc_n.call(null, this__4119.v, this__4119.end, o), this__4119.start, this__4119.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4142 = null;
  var G__4142__4143 = function(coll, f) {
    var this__4120 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__4142__4144 = function(coll, f, start) {
    var this__4121 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__4142 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4142__4143.call(this, coll, f);
      case 3:
        return G__4142__4144.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4142
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4122 = this;
  var subvec_seq__4123 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__4122.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__4122.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__4123.call(null, this__4122.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4124 = this;
  return this__4124.end - this__4124.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4125 = this;
  return cljs.core._nth.call(null, this__4125.v, this__4125.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4126 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__4126.start, this__4126.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__4126.meta, this__4126.v, this__4126.start, this__4126.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__4127 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4128 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4129 = this;
  return new cljs.core.Subvec(meta, this__4129.v, this__4129.start, this__4129.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4130 = this;
  return this__4130.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4146 = null;
  var G__4146__4147 = function(coll, n) {
    var this__4131 = this;
    return cljs.core._nth.call(null, this__4131.v, this__4131.start + n)
  };
  var G__4146__4148 = function(coll, n, not_found) {
    var this__4132 = this;
    return cljs.core._nth.call(null, this__4132.v, this__4132.start + n, not_found)
  };
  G__4146 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4146__4147.call(this, coll, n);
      case 3:
        return G__4146__4148.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4146
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4133 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__4133.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__4150 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__4151 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__4150.call(this, v, start);
      case 3:
        return subvec__4151.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subvec
}();
cljs.core.PersistentQueueSeq = function(meta, front, rear) {
  this.meta = meta;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueueSeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4153 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4154 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4155 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4156 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4156.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4157 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__4158 = this;
  return cljs.core._first.call(null, this__4158.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__4159 = this;
  var temp__3695__auto____4160 = cljs.core.next.call(null, this__4159.front);
  if(cljs.core.truth_(temp__3695__auto____4160)) {
    var f1__4161 = temp__3695__auto____4160;
    return new cljs.core.PersistentQueueSeq(this__4159.meta, f1__4161, this__4159.rear)
  }else {
    if(cljs.core.truth_(this__4159.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__4159.meta, this__4159.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4162 = this;
  return this__4162.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4163 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__4163.front, this__4163.rear)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueue.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4164 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4165 = this;
  if(cljs.core.truth_(this__4165.front)) {
    return new cljs.core.PersistentQueue(this__4165.meta, this__4165.count + 1, this__4165.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____4166 = this__4165.rear;
      if(cljs.core.truth_(or__3548__auto____4166)) {
        return or__3548__auto____4166
      }else {
        return cljs.core.Vector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__4165.meta, this__4165.count + 1, cljs.core.conj.call(null, this__4165.front, o), cljs.core.Vector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4167 = this;
  var rear__4168 = cljs.core.seq.call(null, this__4167.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____4169 = this__4167.front;
    if(cljs.core.truth_(or__3548__auto____4169)) {
      return or__3548__auto____4169
    }else {
      return rear__4168
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__4167.front, cljs.core.seq.call(null, rear__4168))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4170 = this;
  return this__4170.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4171 = this;
  return cljs.core._first.call(null, this__4171.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4172 = this;
  if(cljs.core.truth_(this__4172.front)) {
    var temp__3695__auto____4173 = cljs.core.next.call(null, this__4172.front);
    if(cljs.core.truth_(temp__3695__auto____4173)) {
      var f1__4174 = temp__3695__auto____4173;
      return new cljs.core.PersistentQueue(this__4172.meta, this__4172.count - 1, f1__4174, this__4172.rear)
    }else {
      return new cljs.core.PersistentQueue(this__4172.meta, this__4172.count - 1, cljs.core.seq.call(null, this__4172.rear), cljs.core.Vector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__4175 = this;
  return cljs.core.first.call(null, this__4175.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__4176 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4177 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4178 = this;
  return new cljs.core.PersistentQueue(meta, this__4178.count, this__4178.front, this__4178.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4179 = this;
  return this__4179.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4180 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.Vector.fromArray([]));
cljs.core.NeverEquiv = function() {
};
cljs.core.NeverEquiv.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__4181 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.map_QMARK_.call(null, y)) ? cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, x), cljs.core.count.call(null, y))) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__4182 = array.length;
  var i__4183 = 0;
  while(true) {
    if(cljs.core.truth_(i__4183 < len__4182)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__4183]))) {
        return i__4183
      }else {
        var G__4184 = i__4183 + incr;
        i__4183 = G__4184;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___4186 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4187 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____4185 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____4185)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____4185
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___4186.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4187.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__4190 = cljs.core.hash.call(null, a);
  var b__4191 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__4190 < b__4191)) {
    return-1
  }else {
    if(cljs.core.truth_(a__4190 > b__4191)) {
      return 1
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.ObjMap = function(meta, keys, strobj) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj
};
cljs.core.ObjMap.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4192 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4219 = null;
  var G__4219__4220 = function(coll, k) {
    var this__4193 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__4219__4221 = function(coll, k, not_found) {
    var this__4194 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__4194.strobj, this__4194.strobj[k], not_found)
  };
  G__4219 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4219__4220.call(this, coll, k);
      case 3:
        return G__4219__4221.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4219
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4195 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__4196 = goog.object.clone.call(null, this__4195.strobj);
    var overwrite_QMARK___4197 = new_strobj__4196.hasOwnProperty(k);
    new_strobj__4196[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___4197)) {
      return new cljs.core.ObjMap(this__4195.meta, this__4195.keys, new_strobj__4196)
    }else {
      var new_keys__4198 = cljs.core.aclone.call(null, this__4195.keys);
      new_keys__4198.push(k);
      return new cljs.core.ObjMap(this__4195.meta, new_keys__4198, new_strobj__4196)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__4195.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__4199 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__4199.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__4223 = null;
  var G__4223__4224 = function(tsym4200, k) {
    var this__4202 = this;
    var tsym4200__4203 = this;
    var coll__4204 = tsym4200__4203;
    return cljs.core._lookup.call(null, coll__4204, k)
  };
  var G__4223__4225 = function(tsym4201, k, not_found) {
    var this__4205 = this;
    var tsym4201__4206 = this;
    var coll__4207 = tsym4201__4206;
    return cljs.core._lookup.call(null, coll__4207, k, not_found)
  };
  G__4223 = function(tsym4201, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4223__4224.call(this, tsym4201, k);
      case 3:
        return G__4223__4225.call(this, tsym4201, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4223
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__4208 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4209 = this;
  if(cljs.core.truth_(this__4209.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__4189_SHARP_) {
      return cljs.core.vector.call(null, p1__4189_SHARP_, this__4209.strobj[p1__4189_SHARP_])
    }, this__4209.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4210 = this;
  return this__4210.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4211 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4212 = this;
  return new cljs.core.ObjMap(meta, this__4212.keys, this__4212.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4213 = this;
  return this__4213.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4214 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__4214.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__4215 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____4216 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____4216)) {
      return this__4215.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____4216
    }
  }())) {
    var new_keys__4217 = cljs.core.aclone.call(null, this__4215.keys);
    var new_strobj__4218 = goog.object.clone.call(null, this__4215.strobj);
    new_keys__4217.splice(cljs.core.scan_array.call(null, 1, k, new_keys__4217), 1);
    cljs.core.js_delete.call(null, new_strobj__4218, k);
    return new cljs.core.ObjMap(this__4215.meta, new_keys__4217, new_strobj__4218)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, cljs.core.array.call(null), cljs.core.js_obj.call(null));
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj)
};
cljs.core.HashMap = function(meta, count, hashobj) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj
};
cljs.core.HashMap.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4228 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4266 = null;
  var G__4266__4267 = function(coll, k) {
    var this__4229 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__4266__4268 = function(coll, k, not_found) {
    var this__4230 = this;
    var bucket__4231 = this__4230.hashobj[cljs.core.hash.call(null, k)];
    var i__4232 = cljs.core.truth_(bucket__4231) ? cljs.core.scan_array.call(null, 2, k, bucket__4231) : null;
    if(cljs.core.truth_(i__4232)) {
      return bucket__4231[i__4232 + 1]
    }else {
      return not_found
    }
  };
  G__4266 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4266__4267.call(this, coll, k);
      case 3:
        return G__4266__4268.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4266
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4233 = this;
  var h__4234 = cljs.core.hash.call(null, k);
  var bucket__4235 = this__4233.hashobj[h__4234];
  if(cljs.core.truth_(bucket__4235)) {
    var new_bucket__4236 = cljs.core.aclone.call(null, bucket__4235);
    var new_hashobj__4237 = goog.object.clone.call(null, this__4233.hashobj);
    new_hashobj__4237[h__4234] = new_bucket__4236;
    var temp__3695__auto____4238 = cljs.core.scan_array.call(null, 2, k, new_bucket__4236);
    if(cljs.core.truth_(temp__3695__auto____4238)) {
      var i__4239 = temp__3695__auto____4238;
      new_bucket__4236[i__4239 + 1] = v;
      return new cljs.core.HashMap(this__4233.meta, this__4233.count, new_hashobj__4237)
    }else {
      new_bucket__4236.push(k, v);
      return new cljs.core.HashMap(this__4233.meta, this__4233.count + 1, new_hashobj__4237)
    }
  }else {
    var new_hashobj__4240 = goog.object.clone.call(null, this__4233.hashobj);
    new_hashobj__4240[h__4234] = cljs.core.array.call(null, k, v);
    return new cljs.core.HashMap(this__4233.meta, this__4233.count + 1, new_hashobj__4240)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__4241 = this;
  var bucket__4242 = this__4241.hashobj[cljs.core.hash.call(null, k)];
  var i__4243 = cljs.core.truth_(bucket__4242) ? cljs.core.scan_array.call(null, 2, k, bucket__4242) : null;
  if(cljs.core.truth_(i__4243)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__4270 = null;
  var G__4270__4271 = function(tsym4244, k) {
    var this__4246 = this;
    var tsym4244__4247 = this;
    var coll__4248 = tsym4244__4247;
    return cljs.core._lookup.call(null, coll__4248, k)
  };
  var G__4270__4272 = function(tsym4245, k, not_found) {
    var this__4249 = this;
    var tsym4245__4250 = this;
    var coll__4251 = tsym4245__4250;
    return cljs.core._lookup.call(null, coll__4251, k, not_found)
  };
  G__4270 = function(tsym4245, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4270__4271.call(this, tsym4245, k);
      case 3:
        return G__4270__4272.call(this, tsym4245, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4270
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__4252 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4253 = this;
  if(cljs.core.truth_(this__4253.count > 0)) {
    var hashes__4254 = cljs.core.js_keys.call(null, this__4253.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__4227_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__4253.hashobj[p1__4227_SHARP_]))
    }, hashes__4254)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4255 = this;
  return this__4255.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4256 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4257 = this;
  return new cljs.core.HashMap(meta, this__4257.count, this__4257.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4258 = this;
  return this__4258.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4259 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__4259.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__4260 = this;
  var h__4261 = cljs.core.hash.call(null, k);
  var bucket__4262 = this__4260.hashobj[h__4261];
  var i__4263 = cljs.core.truth_(bucket__4262) ? cljs.core.scan_array.call(null, 2, k, bucket__4262) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__4263))) {
    return coll
  }else {
    var new_hashobj__4264 = goog.object.clone.call(null, this__4260.hashobj);
    if(cljs.core.truth_(3 > bucket__4262.length)) {
      cljs.core.js_delete.call(null, new_hashobj__4264, h__4261)
    }else {
      var new_bucket__4265 = cljs.core.aclone.call(null, bucket__4262);
      new_bucket__4265.splice(i__4263, 2);
      new_hashobj__4264[h__4261] = new_bucket__4265
    }
    return new cljs.core.HashMap(this__4260.meta, this__4260.count - 1, new_hashobj__4264)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__4274 = ks.length;
  var i__4275 = 0;
  var out__4276 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__4275 < len__4274)) {
      var G__4277 = i__4275 + 1;
      var G__4278 = cljs.core.assoc.call(null, out__4276, ks[i__4275], vs[i__4275]);
      i__4275 = G__4277;
      out__4276 = G__4278;
      continue
    }else {
      return out__4276
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__4279 = cljs.core.seq.call(null, keyvals);
    var out__4280 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__4279)) {
        var G__4281 = cljs.core.nnext.call(null, in$__4279);
        var G__4282 = cljs.core.assoc.call(null, out__4280, cljs.core.first.call(null, in$__4279), cljs.core.second.call(null, in$__4279));
        in$__4279 = G__4281;
        out__4280 = G__4282;
        continue
      }else {
        return out__4280
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__4283) {
    var keyvals = cljs.core.seq(arglist__4283);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__4284_SHARP_, p2__4285_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____4286 = p1__4284_SHARP_;
          if(cljs.core.truth_(or__3548__auto____4286)) {
            return or__3548__auto____4286
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__4285_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__4287) {
    var maps = cljs.core.seq(arglist__4287);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__4290 = function(m, e) {
        var k__4288 = cljs.core.first.call(null, e);
        var v__4289 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__4288))) {
          return cljs.core.assoc.call(null, m, k__4288, f.call(null, cljs.core.get.call(null, m, k__4288), v__4289))
        }else {
          return cljs.core.assoc.call(null, m, k__4288, v__4289)
        }
      };
      var merge2__4292 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__4290, function() {
          var or__3548__auto____4291 = m1;
          if(cljs.core.truth_(or__3548__auto____4291)) {
            return or__3548__auto____4291
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__4292, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__4293) {
    var f = cljs.core.first(arglist__4293);
    var maps = cljs.core.rest(arglist__4293);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__4295 = cljs.core.ObjMap.fromObject([], {});
  var keys__4296 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__4296)) {
      var key__4297 = cljs.core.first.call(null, keys__4296);
      var entry__4298 = cljs.core.get.call(null, map, key__4297, "\ufdd0'user/not-found");
      var G__4299 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__4298, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__4295, key__4297, entry__4298) : ret__4295;
      var G__4300 = cljs.core.next.call(null, keys__4296);
      ret__4295 = G__4299;
      keys__4296 = G__4300;
      continue
    }else {
      return ret__4295
    }
    break
  }
};
cljs.core.Set = function(meta, hash_map) {
  this.meta = meta;
  this.hash_map = hash_map
};
cljs.core.Set.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Set")
};
cljs.core.Set.prototype.cljs$core$IHash$ = true;
cljs.core.Set.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4301 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4322 = null;
  var G__4322__4323 = function(coll, v) {
    var this__4302 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__4322__4324 = function(coll, v, not_found) {
    var this__4303 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__4303.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__4322 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4322__4323.call(this, coll, v);
      case 3:
        return G__4322__4324.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4322
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__4326 = null;
  var G__4326__4327 = function(tsym4304, k) {
    var this__4306 = this;
    var tsym4304__4307 = this;
    var coll__4308 = tsym4304__4307;
    return cljs.core._lookup.call(null, coll__4308, k)
  };
  var G__4326__4328 = function(tsym4305, k, not_found) {
    var this__4309 = this;
    var tsym4305__4310 = this;
    var coll__4311 = tsym4305__4310;
    return cljs.core._lookup.call(null, coll__4311, k, not_found)
  };
  G__4326 = function(tsym4305, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4326__4327.call(this, tsym4305, k);
      case 3:
        return G__4326__4328.call(this, tsym4305, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4326
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4312 = this;
  return new cljs.core.Set(this__4312.meta, cljs.core.assoc.call(null, this__4312.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4313 = this;
  return cljs.core.keys.call(null, this__4313.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__4314 = this;
  return new cljs.core.Set(this__4314.meta, cljs.core.dissoc.call(null, this__4314.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4315 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4316 = this;
  var and__3546__auto____4317 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____4317)) {
    var and__3546__auto____4318 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____4318)) {
      return cljs.core.every_QMARK_.call(null, function(p1__4294_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__4294_SHARP_)
      }, other)
    }else {
      return and__3546__auto____4318
    }
  }else {
    return and__3546__auto____4317
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4319 = this;
  return new cljs.core.Set(meta, this__4319.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4320 = this;
  return this__4320.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4321 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__4321.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__4331 = cljs.core.seq.call(null, coll);
  var out__4332 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__4331)))) {
      var G__4333 = cljs.core.rest.call(null, in$__4331);
      var G__4334 = cljs.core.conj.call(null, out__4332, cljs.core.first.call(null, in$__4331));
      in$__4331 = G__4333;
      out__4332 = G__4334;
      continue
    }else {
      return out__4332
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__4335 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____4336 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____4336)) {
        var e__4337 = temp__3695__auto____4336;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__4337))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__4335, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__4330_SHARP_) {
      var temp__3695__auto____4338 = cljs.core.find.call(null, smap, p1__4330_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____4338)) {
        var e__4339 = temp__3695__auto____4338;
        return cljs.core.second.call(null, e__4339)
      }else {
        return p1__4330_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__4347 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__4340, seen) {
        while(true) {
          var vec__4341__4342 = p__4340;
          var f__4343 = cljs.core.nth.call(null, vec__4341__4342, 0, null);
          var xs__4344 = vec__4341__4342;
          var temp__3698__auto____4345 = cljs.core.seq.call(null, xs__4344);
          if(cljs.core.truth_(temp__3698__auto____4345)) {
            var s__4346 = temp__3698__auto____4345;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__4343))) {
              var G__4348 = cljs.core.rest.call(null, s__4346);
              var G__4349 = seen;
              p__4340 = G__4348;
              seen = G__4349;
              continue
            }else {
              return cljs.core.cons.call(null, f__4343, step.call(null, cljs.core.rest.call(null, s__4346), cljs.core.conj.call(null, seen, f__4343)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__4347.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__4350 = cljs.core.Vector.fromArray([]);
  var s__4351 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__4351))) {
      var G__4352 = cljs.core.conj.call(null, ret__4350, cljs.core.first.call(null, s__4351));
      var G__4353 = cljs.core.next.call(null, s__4351);
      ret__4350 = G__4352;
      s__4351 = G__4353;
      continue
    }else {
      return cljs.core.seq.call(null, ret__4350)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____4354 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____4354)) {
        return or__3548__auto____4354
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__4355 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__4355 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__4355 + 1)
      }
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Doesn't support name: ", x));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(cljs.core.truth_(function() {
    var or__3548__auto____4356 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____4356)) {
      return or__3548__auto____4356
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__4357 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__4357 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__4357)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__4360 = cljs.core.ObjMap.fromObject([], {});
  var ks__4361 = cljs.core.seq.call(null, keys);
  var vs__4362 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____4363 = ks__4361;
      if(cljs.core.truth_(and__3546__auto____4363)) {
        return vs__4362
      }else {
        return and__3546__auto____4363
      }
    }())) {
      var G__4364 = cljs.core.assoc.call(null, map__4360, cljs.core.first.call(null, ks__4361), cljs.core.first.call(null, vs__4362));
      var G__4365 = cljs.core.next.call(null, ks__4361);
      var G__4366 = cljs.core.next.call(null, vs__4362);
      map__4360 = G__4364;
      ks__4361 = G__4365;
      vs__4362 = G__4366;
      continue
    }else {
      return map__4360
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__4369 = function(k, x) {
    return x
  };
  var max_key__4370 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__4371 = function() {
    var G__4373__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4358_SHARP_, p2__4359_SHARP_) {
        return max_key.call(null, k, p1__4358_SHARP_, p2__4359_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__4373 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4373__delegate.call(this, k, x, y, more)
    };
    G__4373.cljs$lang$maxFixedArity = 3;
    G__4373.cljs$lang$applyTo = function(arglist__4374) {
      var k = cljs.core.first(arglist__4374);
      var x = cljs.core.first(cljs.core.next(arglist__4374));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4374)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4374)));
      return G__4373__delegate.call(this, k, x, y, more)
    };
    return G__4373
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__4369.call(this, k, x);
      case 3:
        return max_key__4370.call(this, k, x, y);
      default:
        return max_key__4371.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4371.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__4375 = function(k, x) {
    return x
  };
  var min_key__4376 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__4377 = function() {
    var G__4379__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4367_SHARP_, p2__4368_SHARP_) {
        return min_key.call(null, k, p1__4367_SHARP_, p2__4368_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__4379 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4379__delegate.call(this, k, x, y, more)
    };
    G__4379.cljs$lang$maxFixedArity = 3;
    G__4379.cljs$lang$applyTo = function(arglist__4380) {
      var k = cljs.core.first(arglist__4380);
      var x = cljs.core.first(cljs.core.next(arglist__4380));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4380)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4380)));
      return G__4379__delegate.call(this, k, x, y, more)
    };
    return G__4379
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__4375.call(this, k, x);
      case 3:
        return min_key__4376.call(this, k, x, y);
      default:
        return min_key__4377.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4377.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__4383 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__4384 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4381 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4381)) {
        var s__4382 = temp__3698__auto____4381;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__4382), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__4382)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__4383.call(this, n, step);
      case 3:
        return partition_all__4384.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4386 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4386)) {
      var s__4387 = temp__3698__auto____4386;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__4387)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__4387), take_while.call(null, pred, cljs.core.rest.call(null, s__4387)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.Range = function(meta, start, end, step) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step
};
cljs.core.Range.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash = function(rng) {
  var this__4388 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__4389 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4405 = null;
  var G__4405__4406 = function(rng, f) {
    var this__4390 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__4405__4407 = function(rng, f, s) {
    var this__4391 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__4405 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__4405__4406.call(this, rng, f);
      case 3:
        return G__4405__4407.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4405
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__4392 = this;
  var comp__4393 = cljs.core.truth_(this__4392.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__4393.call(null, this__4392.start, this__4392.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__4394 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__4394.end - this__4394.start) / this__4394.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__4395 = this;
  return this__4395.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__4396 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__4396.meta, this__4396.start + this__4396.step, this__4396.end, this__4396.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__4397 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__4398 = this;
  return new cljs.core.Range(meta, this__4398.start, this__4398.end, this__4398.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__4399 = this;
  return this__4399.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4409 = null;
  var G__4409__4410 = function(rng, n) {
    var this__4400 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__4400.start + n * this__4400.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4401 = this__4400.start > this__4400.end;
        if(cljs.core.truth_(and__3546__auto____4401)) {
          return cljs.core._EQ_.call(null, this__4400.step, 0)
        }else {
          return and__3546__auto____4401
        }
      }())) {
        return this__4400.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__4409__4411 = function(rng, n, not_found) {
    var this__4402 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__4402.start + n * this__4402.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4403 = this__4402.start > this__4402.end;
        if(cljs.core.truth_(and__3546__auto____4403)) {
          return cljs.core._EQ_.call(null, this__4402.step, 0)
        }else {
          return and__3546__auto____4403
        }
      }())) {
        return this__4402.start
      }else {
        return not_found
      }
    }
  };
  G__4409 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4409__4410.call(this, rng, n);
      case 3:
        return G__4409__4411.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4409
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__4404 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4404.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__4413 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__4414 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__4415 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__4416 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__4413.call(this);
      case 1:
        return range__4414.call(this, start);
      case 2:
        return range__4415.call(this, start, end);
      case 3:
        return range__4416.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4418 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4418)) {
      var s__4419 = temp__3698__auto____4418;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__4419), take_nth.call(null, n, cljs.core.drop.call(null, n, s__4419)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4421 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4421)) {
      var s__4422 = temp__3698__auto____4421;
      var fst__4423 = cljs.core.first.call(null, s__4422);
      var fv__4424 = f.call(null, fst__4423);
      var run__4425 = cljs.core.cons.call(null, fst__4423, cljs.core.take_while.call(null, function(p1__4420_SHARP_) {
        return cljs.core._EQ_.call(null, fv__4424, f.call(null, p1__4420_SHARP_))
      }, cljs.core.next.call(null, s__4422)));
      return cljs.core.cons.call(null, run__4425, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__4425), s__4422))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__4440 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____4436 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____4436)) {
        var s__4437 = temp__3695__auto____4436;
        return reductions.call(null, f, cljs.core.first.call(null, s__4437), cljs.core.rest.call(null, s__4437))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__4441 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4438 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4438)) {
        var s__4439 = temp__3698__auto____4438;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__4439)), cljs.core.rest.call(null, s__4439))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__4440.call(this, f, init);
      case 3:
        return reductions__4441.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__4444 = function(f) {
    return function() {
      var G__4449 = null;
      var G__4449__4450 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__4449__4451 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__4449__4452 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__4449__4453 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__4449__4454 = function() {
        var G__4456__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__4456 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4456__delegate.call(this, x, y, z, args)
        };
        G__4456.cljs$lang$maxFixedArity = 3;
        G__4456.cljs$lang$applyTo = function(arglist__4457) {
          var x = cljs.core.first(arglist__4457);
          var y = cljs.core.first(cljs.core.next(arglist__4457));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4457)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4457)));
          return G__4456__delegate.call(this, x, y, z, args)
        };
        return G__4456
      }();
      G__4449 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4449__4450.call(this);
          case 1:
            return G__4449__4451.call(this, x);
          case 2:
            return G__4449__4452.call(this, x, y);
          case 3:
            return G__4449__4453.call(this, x, y, z);
          default:
            return G__4449__4454.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4449.cljs$lang$maxFixedArity = 3;
      G__4449.cljs$lang$applyTo = G__4449__4454.cljs$lang$applyTo;
      return G__4449
    }()
  };
  var juxt__4445 = function(f, g) {
    return function() {
      var G__4458 = null;
      var G__4458__4459 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__4458__4460 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__4458__4461 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__4458__4462 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__4458__4463 = function() {
        var G__4465__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__4465 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4465__delegate.call(this, x, y, z, args)
        };
        G__4465.cljs$lang$maxFixedArity = 3;
        G__4465.cljs$lang$applyTo = function(arglist__4466) {
          var x = cljs.core.first(arglist__4466);
          var y = cljs.core.first(cljs.core.next(arglist__4466));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4466)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4466)));
          return G__4465__delegate.call(this, x, y, z, args)
        };
        return G__4465
      }();
      G__4458 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4458__4459.call(this);
          case 1:
            return G__4458__4460.call(this, x);
          case 2:
            return G__4458__4461.call(this, x, y);
          case 3:
            return G__4458__4462.call(this, x, y, z);
          default:
            return G__4458__4463.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4458.cljs$lang$maxFixedArity = 3;
      G__4458.cljs$lang$applyTo = G__4458__4463.cljs$lang$applyTo;
      return G__4458
    }()
  };
  var juxt__4446 = function(f, g, h) {
    return function() {
      var G__4467 = null;
      var G__4467__4468 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__4467__4469 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__4467__4470 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__4467__4471 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__4467__4472 = function() {
        var G__4474__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__4474 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4474__delegate.call(this, x, y, z, args)
        };
        G__4474.cljs$lang$maxFixedArity = 3;
        G__4474.cljs$lang$applyTo = function(arglist__4475) {
          var x = cljs.core.first(arglist__4475);
          var y = cljs.core.first(cljs.core.next(arglist__4475));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4475)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4475)));
          return G__4474__delegate.call(this, x, y, z, args)
        };
        return G__4474
      }();
      G__4467 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4467__4468.call(this);
          case 1:
            return G__4467__4469.call(this, x);
          case 2:
            return G__4467__4470.call(this, x, y);
          case 3:
            return G__4467__4471.call(this, x, y, z);
          default:
            return G__4467__4472.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4467.cljs$lang$maxFixedArity = 3;
      G__4467.cljs$lang$applyTo = G__4467__4472.cljs$lang$applyTo;
      return G__4467
    }()
  };
  var juxt__4447 = function() {
    var G__4476__delegate = function(f, g, h, fs) {
      var fs__4443 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__4477 = null;
        var G__4477__4478 = function() {
          return cljs.core.reduce.call(null, function(p1__4426_SHARP_, p2__4427_SHARP_) {
            return cljs.core.conj.call(null, p1__4426_SHARP_, p2__4427_SHARP_.call(null))
          }, cljs.core.Vector.fromArray([]), fs__4443)
        };
        var G__4477__4479 = function(x) {
          return cljs.core.reduce.call(null, function(p1__4428_SHARP_, p2__4429_SHARP_) {
            return cljs.core.conj.call(null, p1__4428_SHARP_, p2__4429_SHARP_.call(null, x))
          }, cljs.core.Vector.fromArray([]), fs__4443)
        };
        var G__4477__4480 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__4430_SHARP_, p2__4431_SHARP_) {
            return cljs.core.conj.call(null, p1__4430_SHARP_, p2__4431_SHARP_.call(null, x, y))
          }, cljs.core.Vector.fromArray([]), fs__4443)
        };
        var G__4477__4481 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__4432_SHARP_, p2__4433_SHARP_) {
            return cljs.core.conj.call(null, p1__4432_SHARP_, p2__4433_SHARP_.call(null, x, y, z))
          }, cljs.core.Vector.fromArray([]), fs__4443)
        };
        var G__4477__4482 = function() {
          var G__4484__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__4434_SHARP_, p2__4435_SHARP_) {
              return cljs.core.conj.call(null, p1__4434_SHARP_, cljs.core.apply.call(null, p2__4435_SHARP_, x, y, z, args))
            }, cljs.core.Vector.fromArray([]), fs__4443)
          };
          var G__4484 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4484__delegate.call(this, x, y, z, args)
          };
          G__4484.cljs$lang$maxFixedArity = 3;
          G__4484.cljs$lang$applyTo = function(arglist__4485) {
            var x = cljs.core.first(arglist__4485);
            var y = cljs.core.first(cljs.core.next(arglist__4485));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4485)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4485)));
            return G__4484__delegate.call(this, x, y, z, args)
          };
          return G__4484
        }();
        G__4477 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__4477__4478.call(this);
            case 1:
              return G__4477__4479.call(this, x);
            case 2:
              return G__4477__4480.call(this, x, y);
            case 3:
              return G__4477__4481.call(this, x, y, z);
            default:
              return G__4477__4482.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__4477.cljs$lang$maxFixedArity = 3;
        G__4477.cljs$lang$applyTo = G__4477__4482.cljs$lang$applyTo;
        return G__4477
      }()
    };
    var G__4476 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4476__delegate.call(this, f, g, h, fs)
    };
    G__4476.cljs$lang$maxFixedArity = 3;
    G__4476.cljs$lang$applyTo = function(arglist__4486) {
      var f = cljs.core.first(arglist__4486);
      var g = cljs.core.first(cljs.core.next(arglist__4486));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4486)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4486)));
      return G__4476__delegate.call(this, f, g, h, fs)
    };
    return G__4476
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__4444.call(this, f);
      case 2:
        return juxt__4445.call(this, f, g);
      case 3:
        return juxt__4446.call(this, f, g, h);
      default:
        return juxt__4447.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4447.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__4488 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__4491 = cljs.core.next.call(null, coll);
        coll = G__4491;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__4489 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4487 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____4487)) {
          return n > 0
        }else {
          return and__3546__auto____4487
        }
      }())) {
        var G__4492 = n - 1;
        var G__4493 = cljs.core.next.call(null, coll);
        n = G__4492;
        coll = G__4493;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__4488.call(this, n);
      case 2:
        return dorun__4489.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__4494 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__4495 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__4494.call(this, n);
      case 2:
        return doall__4495.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__4497 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__4497), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__4497), 1))) {
      return cljs.core.first.call(null, matches__4497)
    }else {
      return cljs.core.vec.call(null, matches__4497)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__4498 = re.exec(s);
  if(cljs.core.truth_(matches__4498 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__4498), 1))) {
      return cljs.core.first.call(null, matches__4498)
    }else {
      return cljs.core.vec.call(null, matches__4498)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__4499 = cljs.core.re_find.call(null, re, s);
  var match_idx__4500 = s.search(re);
  var match_str__4501 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__4499)) ? cljs.core.first.call(null, match_data__4499) : match_data__4499;
  var post_match__4502 = cljs.core.subs.call(null, s, match_idx__4500 + cljs.core.count.call(null, match_str__4501));
  if(cljs.core.truth_(match_data__4499)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__4499, re_seq.call(null, re, post_match__4502))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__4504__4505 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___4506 = cljs.core.nth.call(null, vec__4504__4505, 0, null);
  var flags__4507 = cljs.core.nth.call(null, vec__4504__4505, 1, null);
  var pattern__4508 = cljs.core.nth.call(null, vec__4504__4505, 2, null);
  return new RegExp(pattern__4508, flags__4507)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.Vector.fromArray([sep]), cljs.core.map.call(null, function(p1__4503_SHARP_) {
    return print_one.call(null, p1__4503_SHARP_, opts)
  }, coll))), cljs.core.Vector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(cljs.core.truth_(obj === null)) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(cljs.core.truth_(void 0 === obj)) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____4509 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____4509)) {
            var and__3546__auto____4513 = function() {
              var x__450__auto____4510 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____4511 = x__450__auto____4510;
                if(cljs.core.truth_(and__3546__auto____4511)) {
                  var and__3546__auto____4512 = x__450__auto____4510.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____4512)) {
                    return cljs.core.not.call(null, x__450__auto____4510.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____4512
                  }
                }else {
                  return and__3546__auto____4511
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____4510)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____4513)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____4513
            }
          }else {
            return and__3546__auto____4509
          }
        }()) ? cljs.core.concat.call(null, cljs.core.Vector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.Vector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__450__auto____4514 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____4515 = x__450__auto____4514;
            if(cljs.core.truth_(and__3546__auto____4515)) {
              var and__3546__auto____4516 = x__450__auto____4514.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____4516)) {
                return cljs.core.not.call(null, x__450__auto____4514.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____4516
              }
            }else {
              return and__3546__auto____4515
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__450__auto____4514)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  var first_obj__4517 = cljs.core.first.call(null, objs);
  var sb__4518 = new goog.string.StringBuffer;
  var G__4519__4520 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__4519__4520)) {
    var obj__4521 = cljs.core.first.call(null, G__4519__4520);
    var G__4519__4522 = G__4519__4520;
    while(true) {
      if(cljs.core.truth_(obj__4521 === first_obj__4517)) {
      }else {
        sb__4518.append(" ")
      }
      var G__4523__4524 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__4521, opts));
      if(cljs.core.truth_(G__4523__4524)) {
        var string__4525 = cljs.core.first.call(null, G__4523__4524);
        var G__4523__4526 = G__4523__4524;
        while(true) {
          sb__4518.append(string__4525);
          var temp__3698__auto____4527 = cljs.core.next.call(null, G__4523__4526);
          if(cljs.core.truth_(temp__3698__auto____4527)) {
            var G__4523__4528 = temp__3698__auto____4527;
            var G__4531 = cljs.core.first.call(null, G__4523__4528);
            var G__4532 = G__4523__4528;
            string__4525 = G__4531;
            G__4523__4526 = G__4532;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____4529 = cljs.core.next.call(null, G__4519__4522);
      if(cljs.core.truth_(temp__3698__auto____4529)) {
        var G__4519__4530 = temp__3698__auto____4529;
        var G__4533 = cljs.core.first.call(null, G__4519__4530);
        var G__4534 = G__4519__4530;
        obj__4521 = G__4533;
        G__4519__4522 = G__4534;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return cljs.core.str.call(null, sb__4518)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__4535 = cljs.core.first.call(null, objs);
  var G__4536__4537 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__4536__4537)) {
    var obj__4538 = cljs.core.first.call(null, G__4536__4537);
    var G__4536__4539 = G__4536__4537;
    while(true) {
      if(cljs.core.truth_(obj__4538 === first_obj__4535)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__4540__4541 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__4538, opts));
      if(cljs.core.truth_(G__4540__4541)) {
        var string__4542 = cljs.core.first.call(null, G__4540__4541);
        var G__4540__4543 = G__4540__4541;
        while(true) {
          cljs.core.string_print.call(null, string__4542);
          var temp__3698__auto____4544 = cljs.core.next.call(null, G__4540__4543);
          if(cljs.core.truth_(temp__3698__auto____4544)) {
            var G__4540__4545 = temp__3698__auto____4544;
            var G__4548 = cljs.core.first.call(null, G__4540__4545);
            var G__4549 = G__4540__4545;
            string__4542 = G__4548;
            G__4540__4543 = G__4549;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____4546 = cljs.core.next.call(null, G__4536__4539);
      if(cljs.core.truth_(temp__3698__auto____4546)) {
        var G__4536__4547 = temp__3698__auto____4546;
        var G__4550 = cljs.core.first.call(null, G__4536__4547);
        var G__4551 = G__4536__4547;
        obj__4538 = G__4550;
        G__4536__4539 = G__4551;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__4552) {
    var objs = cljs.core.seq(arglist__4552);
    return pr_str__delegate.call(this, objs)
  };
  return pr_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__4553) {
    var objs = cljs.core.seq(arglist__4553);
    return pr__delegate.call(this, objs)
  };
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__4554) {
    var objs = cljs.core.seq(arglist__4554);
    return cljs_core_print__delegate.call(this, objs)
  };
  return cljs_core_print
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__4555) {
    var objs = cljs.core.seq(arglist__4555);
    return println__delegate.call(this, objs)
  };
  return println
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__4556) {
    var objs = cljs.core.seq(arglist__4556);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__4557 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__4557, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, n))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, bool))
};
cljs.core.Set.prototype.cljs$core$IPrintable$ = true;
cljs.core.Set.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, cljs.core.str.call(null, ":", function() {
      var temp__3698__auto____4558 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____4558)) {
        var nspc__4559 = temp__3698__auto____4558;
        return cljs.core.str.call(null, nspc__4559, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____4560 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____4560)) {
          var nspc__4561 = temp__3698__auto____4560;
          return cljs.core.str.call(null, nspc__4561, "/")
        }else {
          return null
        }
      }(), cljs.core.name.call(null, obj)))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", cljs.core.str.call(null, this$), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__4562 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__4562, "{", ", ", "}", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches
};
cljs.core.Atom.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__4563 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__4564 = this;
  var G__4565__4566 = cljs.core.seq.call(null, this__4564.watches);
  if(cljs.core.truth_(G__4565__4566)) {
    var G__4568__4570 = cljs.core.first.call(null, G__4565__4566);
    var vec__4569__4571 = G__4568__4570;
    var key__4572 = cljs.core.nth.call(null, vec__4569__4571, 0, null);
    var f__4573 = cljs.core.nth.call(null, vec__4569__4571, 1, null);
    var G__4565__4574 = G__4565__4566;
    var G__4568__4575 = G__4568__4570;
    var G__4565__4576 = G__4565__4574;
    while(true) {
      var vec__4577__4578 = G__4568__4575;
      var key__4579 = cljs.core.nth.call(null, vec__4577__4578, 0, null);
      var f__4580 = cljs.core.nth.call(null, vec__4577__4578, 1, null);
      var G__4565__4581 = G__4565__4576;
      f__4580.call(null, key__4579, this$, oldval, newval);
      var temp__3698__auto____4582 = cljs.core.next.call(null, G__4565__4581);
      if(cljs.core.truth_(temp__3698__auto____4582)) {
        var G__4565__4583 = temp__3698__auto____4582;
        var G__4590 = cljs.core.first.call(null, G__4565__4583);
        var G__4591 = G__4565__4583;
        G__4568__4575 = G__4590;
        G__4565__4576 = G__4591;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch = function(this$, key, f) {
  var this__4584 = this;
  return this$.watches = cljs.core.assoc.call(null, this__4584.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__4585 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__4585.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__4586 = this;
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__4586.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__4587 = this;
  return this__4587.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__4588 = this;
  return this__4588.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__4589 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__4598 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__4599 = function() {
    var G__4601__delegate = function(x, p__4592) {
      var map__4593__4594 = p__4592;
      var map__4593__4595 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4593__4594)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4593__4594) : map__4593__4594;
      var validator__4596 = cljs.core.get.call(null, map__4593__4595, "\ufdd0'validator");
      var meta__4597 = cljs.core.get.call(null, map__4593__4595, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__4597, validator__4596, null)
    };
    var G__4601 = function(x, var_args) {
      var p__4592 = null;
      if(goog.isDef(var_args)) {
        p__4592 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4601__delegate.call(this, x, p__4592)
    };
    G__4601.cljs$lang$maxFixedArity = 1;
    G__4601.cljs$lang$applyTo = function(arglist__4602) {
      var x = cljs.core.first(arglist__4602);
      var p__4592 = cljs.core.rest(arglist__4602);
      return G__4601__delegate.call(this, x, p__4592)
    };
    return G__4601
  }();
  atom = function(x, var_args) {
    var p__4592 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__4598.call(this, x);
      default:
        return atom__4599.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__4599.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____4603 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____4603)) {
    var validate__4604 = temp__3698__auto____4603;
    if(cljs.core.truth_(validate__4604.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3073)))));
    }
  }else {
  }
  var old_value__4605 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__4605, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___4606 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___4607 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4608 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___4609 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___4610 = function() {
    var G__4612__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__4612 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__4612__delegate.call(this, a, f, x, y, z, more)
    };
    G__4612.cljs$lang$maxFixedArity = 5;
    G__4612.cljs$lang$applyTo = function(arglist__4613) {
      var a = cljs.core.first(arglist__4613);
      var f = cljs.core.first(cljs.core.next(arglist__4613));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4613)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4613))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4613)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4613)))));
      return G__4612__delegate.call(this, a, f, x, y, z, more)
    };
    return G__4612
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___4606.call(this, a, f);
      case 3:
        return swap_BANG___4607.call(this, a, f, x);
      case 4:
        return swap_BANG___4608.call(this, a, f, x, y);
      case 5:
        return swap_BANG___4609.call(this, a, f, x, y, z);
      default:
        return swap_BANG___4610.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___4610.cljs$lang$applyTo;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, a.state, oldval))) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__4614) {
    var iref = cljs.core.first(arglist__4614);
    var f = cljs.core.first(cljs.core.next(arglist__4614));
    var args = cljs.core.rest(cljs.core.next(arglist__4614));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__4615 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__4616 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__4615.call(this);
      case 1:
        return gensym__4616.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(f, state) {
  this.f = f;
  this.state = state
};
cljs.core.Delay.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_ = function(d) {
  var this__4618 = this;
  return cljs.core.not.call(null, cljs.core.deref.call(null, this__4618.state) === null)
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__4619 = this;
  if(cljs.core.truth_(cljs.core.deref.call(null, this__4619.state))) {
  }else {
    cljs.core.swap_BANG_.call(null, this__4619.state, this__4619.f)
  }
  return cljs.core.deref.call(null, this__4619.state)
};
cljs.core.Delay;
cljs.core.delay = function() {
  var delay__delegate = function(body) {
    return new cljs.core.Delay(function() {
      return cljs.core.apply.call(null, cljs.core.identity, body)
    }, cljs.core.atom.call(null, null))
  };
  var delay = function(var_args) {
    var body = null;
    if(goog.isDef(var_args)) {
      body = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return delay__delegate.call(this, body)
  };
  delay.cljs$lang$maxFixedArity = 0;
  delay.cljs$lang$applyTo = function(arglist__4620) {
    var body = cljs.core.seq(arglist__4620);
    return delay__delegate.call(this, body)
  };
  return delay
}();
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.truth_(cljs.core.delay_QMARK_.call(null, x))) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__4621__4622 = options;
    var map__4621__4623 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4621__4622)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4621__4622) : map__4621__4622;
    var keywordize_keys__4624 = cljs.core.get.call(null, map__4621__4623, "\ufdd0'keywordize-keys");
    var keyfn__4625 = cljs.core.truth_(keywordize_keys__4624) ? cljs.core.keyword : cljs.core.str;
    var f__4631 = function thisfn(x) {
      if(cljs.core.truth_(cljs.core.seq_QMARK_.call(null, x))) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.truth_(goog.isObject.call(null, x))) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__514__auto____4630 = function iter__4626(s__4627) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__4627__4628 = s__4627;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__4627__4628))) {
                        var k__4629 = cljs.core.first.call(null, s__4627__4628);
                        return cljs.core.cons.call(null, cljs.core.Vector.fromArray([keyfn__4625.call(null, k__4629), thisfn.call(null, x[k__4629])]), iter__4626.call(null, cljs.core.rest.call(null, s__4627__4628)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__514__auto____4630.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if(cljs.core.truth_("\ufdd0'else")) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__4631.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__4632) {
    var x = cljs.core.first(arglist__4632);
    var options = cljs.core.rest(arglist__4632);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__4633 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__4637__delegate = function(args) {
      var temp__3695__auto____4634 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__4633), args);
      if(cljs.core.truth_(temp__3695__auto____4634)) {
        var v__4635 = temp__3695__auto____4634;
        return v__4635
      }else {
        var ret__4636 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__4633, cljs.core.assoc, args, ret__4636);
        return ret__4636
      }
    };
    var G__4637 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4637__delegate.call(this, args)
    };
    G__4637.cljs$lang$maxFixedArity = 0;
    G__4637.cljs$lang$applyTo = function(arglist__4638) {
      var args = cljs.core.seq(arglist__4638);
      return G__4637__delegate.call(this, args)
    };
    return G__4637
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__4640 = function(f) {
    while(true) {
      var ret__4639 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__4639))) {
        var G__4643 = ret__4639;
        f = G__4643;
        continue
      }else {
        return ret__4639
      }
      break
    }
  };
  var trampoline__4641 = function() {
    var G__4644__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__4644 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4644__delegate.call(this, f, args)
    };
    G__4644.cljs$lang$maxFixedArity = 1;
    G__4644.cljs$lang$applyTo = function(arglist__4645) {
      var f = cljs.core.first(arglist__4645);
      var args = cljs.core.rest(arglist__4645);
      return G__4644__delegate.call(this, f, args)
    };
    return G__4644
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__4640.call(this, f);
      default:
        return trampoline__4641.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__4641.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__4646 = function() {
    return rand.call(null, 1)
  };
  var rand__4647 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__4646.call(this);
      case 1:
        return rand__4647.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__4649 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__4649, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__4649, cljs.core.Vector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___4658 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___4659 = function(h, child, parent) {
    var or__3548__auto____4650 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____4650)) {
      return or__3548__auto____4650
    }else {
      var or__3548__auto____4651 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____4651)) {
        return or__3548__auto____4651
      }else {
        var and__3546__auto____4652 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____4652)) {
          var and__3546__auto____4653 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____4653)) {
            var and__3546__auto____4654 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____4654)) {
              var ret__4655 = true;
              var i__4656 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____4657 = cljs.core.not.call(null, ret__4655);
                  if(cljs.core.truth_(or__3548__auto____4657)) {
                    return or__3548__auto____4657
                  }else {
                    return cljs.core._EQ_.call(null, i__4656, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__4655
                }else {
                  var G__4661 = isa_QMARK_.call(null, h, child.call(null, i__4656), parent.call(null, i__4656));
                  var G__4662 = i__4656 + 1;
                  ret__4655 = G__4661;
                  i__4656 = G__4662;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____4654
            }
          }else {
            return and__3546__auto____4653
          }
        }else {
          return and__3546__auto____4652
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___4658.call(this, h, child);
      case 3:
        return isa_QMARK___4659.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__4663 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__4664 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__4663.call(this, h);
      case 2:
        return parents__4664.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__4666 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__4667 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__4666.call(this, h);
      case 2:
        return ancestors__4667.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__4669 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__4670 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__4669.call(this, h);
      case 2:
        return descendants__4670.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__4680 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3365)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__4681 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3369)))));
    }
    var tp__4675 = "\ufdd0'parents".call(null, h);
    var td__4676 = "\ufdd0'descendants".call(null, h);
    var ta__4677 = "\ufdd0'ancestors".call(null, h);
    var tf__4678 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____4679 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__4675.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__4677.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__4677.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__4675, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__4678.call(null, "\ufdd0'ancestors".call(null, h), tag, td__4676, parent, ta__4677), "\ufdd0'descendants":tf__4678.call(null, "\ufdd0'descendants".call(null, h), parent, ta__4677, tag, td__4676)})
    }();
    if(cljs.core.truth_(or__3548__auto____4679)) {
      return or__3548__auto____4679
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__4680.call(this, h, tag);
      case 3:
        return derive__4681.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__4687 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__4688 = function(h, tag, parent) {
    var parentMap__4683 = "\ufdd0'parents".call(null, h);
    var childsParents__4684 = cljs.core.truth_(parentMap__4683.call(null, tag)) ? cljs.core.disj.call(null, parentMap__4683.call(null, tag), parent) : cljs.core.set([]);
    var newParents__4685 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__4684)) ? cljs.core.assoc.call(null, parentMap__4683, tag, childsParents__4684) : cljs.core.dissoc.call(null, parentMap__4683, tag);
    var deriv_seq__4686 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__4672_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__4672_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__4672_SHARP_), cljs.core.second.call(null, p1__4672_SHARP_)))
    }, cljs.core.seq.call(null, newParents__4685)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__4683.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__4673_SHARP_, p2__4674_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__4673_SHARP_, p2__4674_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__4686))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__4687.call(this, h, tag);
      case 3:
        return underive__4688.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__4690 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____4692 = cljs.core.truth_(function() {
    var and__3546__auto____4691 = xprefs__4690;
    if(cljs.core.truth_(and__3546__auto____4691)) {
      return xprefs__4690.call(null, y)
    }else {
      return and__3546__auto____4691
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____4692)) {
    return or__3548__auto____4692
  }else {
    var or__3548__auto____4694 = function() {
      var ps__4693 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__4693) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__4693), prefer_table))) {
          }else {
          }
          var G__4697 = cljs.core.rest.call(null, ps__4693);
          ps__4693 = G__4697;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____4694)) {
      return or__3548__auto____4694
    }else {
      var or__3548__auto____4696 = function() {
        var ps__4695 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__4695) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__4695), y, prefer_table))) {
            }else {
            }
            var G__4698 = cljs.core.rest.call(null, ps__4695);
            ps__4695 = G__4698;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____4696)) {
        return or__3548__auto____4696
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____4699 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____4699)) {
    return or__3548__auto____4699
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__4708 = cljs.core.reduce.call(null, function(be, p__4700) {
    var vec__4701__4702 = p__4700;
    var k__4703 = cljs.core.nth.call(null, vec__4701__4702, 0, null);
    var ___4704 = cljs.core.nth.call(null, vec__4701__4702, 1, null);
    var e__4705 = vec__4701__4702;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__4703))) {
      var be2__4707 = cljs.core.truth_(function() {
        var or__3548__auto____4706 = be === null;
        if(cljs.core.truth_(or__3548__auto____4706)) {
          return or__3548__auto____4706
        }else {
          return cljs.core.dominates.call(null, k__4703, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__4705 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__4707), k__4703, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__4703, " and ", cljs.core.first.call(null, be2__4707), ", and neither is preferred"));
      }
      return be2__4707
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__4708)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__4708));
      return cljs.core.second.call(null, best_entry__4708)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4709 = mf;
    if(cljs.core.truth_(and__3546__auto____4709)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____4709
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____4710 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4710)) {
        return or__3548__auto____4710
      }else {
        var or__3548__auto____4711 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____4711)) {
          return or__3548__auto____4711
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4712 = mf;
    if(cljs.core.truth_(and__3546__auto____4712)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____4712
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____4713 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4713)) {
        return or__3548__auto____4713
      }else {
        var or__3548__auto____4714 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____4714)) {
          return or__3548__auto____4714
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4715 = mf;
    if(cljs.core.truth_(and__3546__auto____4715)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____4715
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____4716 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4716)) {
        return or__3548__auto____4716
      }else {
        var or__3548__auto____4717 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____4717)) {
          return or__3548__auto____4717
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4718 = mf;
    if(cljs.core.truth_(and__3546__auto____4718)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____4718
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____4719 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4719)) {
        return or__3548__auto____4719
      }else {
        var or__3548__auto____4720 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____4720)) {
          return or__3548__auto____4720
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4721 = mf;
    if(cljs.core.truth_(and__3546__auto____4721)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____4721
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____4722 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4722)) {
        return or__3548__auto____4722
      }else {
        var or__3548__auto____4723 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____4723)) {
          return or__3548__auto____4723
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4724 = mf;
    if(cljs.core.truth_(and__3546__auto____4724)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____4724
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____4725 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4725)) {
        return or__3548__auto____4725
      }else {
        var or__3548__auto____4726 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____4726)) {
          return or__3548__auto____4726
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4727 = mf;
    if(cljs.core.truth_(and__3546__auto____4727)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____4727
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____4728 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4728)) {
        return or__3548__auto____4728
      }else {
        var or__3548__auto____4729 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____4729)) {
          return or__3548__auto____4729
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4730 = mf;
    if(cljs.core.truth_(and__3546__auto____4730)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____4730
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____4731 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4731)) {
        return or__3548__auto____4731
      }else {
        var or__3548__auto____4732 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____4732)) {
          return or__3548__auto____4732
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__4733 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__4734 = cljs.core._get_method.call(null, mf, dispatch_val__4733);
  if(cljs.core.truth_(target_fn__4734)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__4733));
  }
  return cljs.core.apply.call(null, target_fn__4734, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy
};
cljs.core.MultiFn.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__4735 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__4736 = this;
  cljs.core.swap_BANG_.call(null, this__4736.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4736.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4736.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4736.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__4737 = this;
  cljs.core.swap_BANG_.call(null, this__4737.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__4737.method_cache, this__4737.method_table, this__4737.cached_hierarchy, this__4737.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__4738 = this;
  cljs.core.swap_BANG_.call(null, this__4738.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__4738.method_cache, this__4738.method_table, this__4738.cached_hierarchy, this__4738.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__4739 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__4739.cached_hierarchy), cljs.core.deref.call(null, this__4739.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__4739.method_cache, this__4739.method_table, this__4739.cached_hierarchy, this__4739.hierarchy)
  }
  var temp__3695__auto____4740 = cljs.core.deref.call(null, this__4739.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____4740)) {
    var target_fn__4741 = temp__3695__auto____4740;
    return target_fn__4741
  }else {
    var temp__3695__auto____4742 = cljs.core.find_and_cache_best_method.call(null, this__4739.name, dispatch_val, this__4739.hierarchy, this__4739.method_table, this__4739.prefer_table, this__4739.method_cache, this__4739.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____4742)) {
      var target_fn__4743 = temp__3695__auto____4742;
      return target_fn__4743
    }else {
      return cljs.core.deref.call(null, this__4739.method_table).call(null, this__4739.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__4744 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__4744.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__4744.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__4744.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__4744.method_cache, this__4744.method_table, this__4744.cached_hierarchy, this__4744.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__4745 = this;
  return cljs.core.deref.call(null, this__4745.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__4746 = this;
  return cljs.core.deref.call(null, this__4746.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__4747 = this;
  return cljs.core.do_dispatch.call(null, mf, this__4747.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__4748__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__4748 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__4748__delegate.call(this, _, args)
  };
  G__4748.cljs$lang$maxFixedArity = 1;
  G__4748.cljs$lang$applyTo = function(arglist__4749) {
    var _ = cljs.core.first(arglist__4749);
    var args = cljs.core.rest(arglist__4749);
    return G__4748__delegate.call(this, _, args)
  };
  return G__4748
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("webgl.constants");
goog.require("cljs.core");
webgl.constants.flags = cljs.core.ObjMap.fromObject(["\ufdd0'float", "\ufdd0'array", "\ufdd0'index", "\ufdd0'static", "\ufdd0'color-buffer", "\ufdd0'triangles", "\ufdd0'vertex", "\ufdd0'fragment"], {"\ufdd0'float":WebGLRenderingContext.FLOAT, "\ufdd0'array":WebGLRenderingContext.ARRAY_BUFFER, "\ufdd0'index":WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, "\ufdd0'static":WebGLRenderingContext.STATIC_DRAW, "\ufdd0'color-buffer":WebGLRenderingContext.COLOR_BUFFER_BIT, "\ufdd0'triangles":WebGLRenderingContext.TRIANGLES, 
"\ufdd0'vertex":WebGLRenderingContext.VERTEX_SHADER, "\ufdd0'fragment":WebGLRenderingContext.FRAGMENT_SHADER});
webgl.constants.get = webgl.constants.flags;
goog.provide("webgl.api");
goog.require("cljs.core");
goog.require("webgl.constants");
webgl.api._STAR_context_STAR_ = null;
webgl.api.make_context = function make_context(canvas) {
  return canvas.getContext("experimental-webgl")
};
webgl.api.context = function context() {
  return webgl.api._STAR_context_STAR_
};
webgl.api.canvas = function canvas() {
  return webgl.api._STAR_context_STAR_.canvas
};
webgl.api.with_context = function() {
  var with_context__delegate = function(context, f, args) {
    var _STAR_context_STAR_6230__6231 = webgl.api._STAR_context_STAR_;
    try {
      webgl.api._STAR_context_STAR_ = context;
      return cljs.core.apply.call(null, f, args)
    }finally {
      webgl.api._STAR_context_STAR_ = _STAR_context_STAR_6230__6231
    }
  };
  var with_context = function(context, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return with_context__delegate.call(this, context, f, args)
  };
  with_context.cljs$lang$maxFixedArity = 2;
  with_context.cljs$lang$applyTo = function(arglist__6233) {
    var context = cljs.core.first(arglist__6233);
    var f = cljs.core.first(cljs.core.next(arglist__6233));
    var args = cljs.core.rest(cljs.core.next(arglist__6233));
    return with_context__delegate(context, f, args)
  };
  with_context.cljs$lang$arity$variadic = with_context__delegate;
  return with_context
}();
webgl.api.make_program = function make_program() {
  return webgl.api._STAR_context_STAR_.createProgram()
};
webgl.api.make_shader = function make_shader(type) {
  return webgl.api._STAR_context_STAR_.createShader(webgl.constants.get.call(null, type))
};
webgl.api.set_source = function set_source(shader, code) {
  return webgl.api._STAR_context_STAR_.shaderSource(shader, code)
};
webgl.api.compile_shader = function compile_shader(shader) {
  return webgl.api._STAR_context_STAR_.compileShader(shader)
};
webgl.api.attach_shader = function attach_shader(program, shader) {
  return webgl.api._STAR_context_STAR_.attachShader(program, shader)
};
webgl.api.link_program = function link_program(program) {
  return webgl.api._STAR_context_STAR_.linkProgram(program)
};
webgl.api.use_program = function use_program(program) {
  return webgl.api._STAR_context_STAR_.useProgram(program)
};
webgl.api.make_buffer = function make_buffer() {
  return webgl.api._STAR_context_STAR_.createBuffer()
};
webgl.api.bind_buffer = function bind_buffer(buffer_type, id) {
  return webgl.api._STAR_context_STAR_.bindBuffer(webgl.constants.get.call(null, buffer_type), id)
};
webgl.api.buffer_data = function buffer_data(buffer_type, data) {
  return webgl.api._STAR_context_STAR_.bufferData(webgl.constants.get.call(null, buffer_type), new Float32Array(data), webgl.constants.get.call(null, "\ufdd0'static"))
};
webgl.api.attribute_location = function attribute_location(program, name) {
  return webgl.api._STAR_context_STAR_.getAttribLocation(program, name)
};
webgl.api.vertex_attribute_pointer = function vertex_attribute_pointer(location, size, data_type, normalized_QMARK_, stride, offset) {
  return webgl.api._STAR_context_STAR_.vertexAttribPointer(location, size, webgl.constants.get.call(null, data_type), normalized_QMARK_, stride, offset)
};
webgl.api.enable_vertex_attribute_array = function enable_vertex_attribute_array(location) {
  return webgl.api._STAR_context_STAR_.enableVertexAttribArray(location)
};
webgl.api.uniform_location = function uniform_location(program, name) {
  return webgl.api._STAR_context_STAR_.getUniformLocation(program, name)
};
webgl.api.uniform_matrix = function uniform_matrix(location, value) {
  return webgl.api._STAR_context_STAR_.uniformMatrix4fv(location, false, new Float32Array(value))
};
webgl.api.clear_color = function clear_color(r, g, b, a) {
  return webgl.api._STAR_context_STAR_.clearColor(r, g, b, a)
};
webgl.api.clear = function clear(buffer_type) {
  return webgl.api._STAR_context_STAR_.clear(webgl.constants.get.call(null, buffer_type))
};
webgl.api.draw_arrays = function draw_arrays(primitive_type, offset, n) {
  return webgl.api._STAR_context_STAR_.drawArrays(webgl.constants.get.call(null, primitive_type), offset, n)
};
goog.provide("webgl.program");
goog.require("cljs.core");
goog.require("webgl.constants");
goog.require("webgl.api");
webgl.program.make = webgl.api.make_program;
webgl.program.attach_BANG_ = function attach_BANG_(program, shader_type, code) {
  var shader__6259 = webgl.api.make_shader.call(null, shader_type);
  webgl.api.set_source.call(null, shader__6259, code);
  webgl.api.compile_shader.call(null, shader__6259);
  return webgl.api.attach_shader.call(null, program, shader__6259)
};
webgl.program.link_BANG_ = webgl.api.link_program;
webgl.program.use_BANG_ = webgl.api.use_program;
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("webgl.scalar");
goog.require("cljs.core");
webgl.scalar.time = function time(fps) {
  return function(frame) {
    return frame / fps
  }
};
webgl.scalar.scale = function scale(in$, s) {
  return function(frame) {
    return s * in$.call(null, frame)
  }
};
webgl.scalar.offset = function offset(in$, offset) {
  return function(frame) {
    return offset + in$.call(null, frame)
  }
};
webgl.scalar.modulate = function modulate(lhs, rhs) {
  return function(frame) {
    return lhs.call(null, frame) * rhs.call(null, frame)
  }
};
webgl.scalar.sin = function sin(in$) {
  return function(frame) {
    return Math.sin(in$.call(null, frame))
  }
};
webgl.scalar.cos = function cos(in$) {
  return function(frame) {
    return Math.cos(in$.call(null, frame))
  }
};
webgl.scalar.quadratic = function quadratic(p1__933115_SHARP_) {
  return p1__933115_SHARP_ * p1__933115_SHARP_
};
webgl.scalar.cubic = function cubic(p1__933116_SHARP_) {
  return p1__933116_SHARP_ * p1__933116_SHARP_ * p1__933116_SHARP_
};
webgl.scalar.quartic = function quartic(p1__933117_SHARP_) {
  return p1__933117_SHARP_ * p1__933117_SHARP_ * p1__933117_SHARP_ * p1__933117_SHARP_
};
webgl.scalar.quintic = function quintic(p1__933118_SHARP_) {
  return p1__933118_SHARP_ * p1__933118_SHARP_ * p1__933118_SHARP_ * p1__933118_SHARP_ * p1__933118_SHARP_
};
webgl.scalar.easing = function easing(in$, f) {
  return function(frame) {
    var t__933122 = in$.call(null, frame);
    var s__933123 = -1;
    var c__933124 = t__933122 + 1;
    return s__933123 + (c__933124 < 1 ? f.call(null, c__933124) : 2 - f.call(null, 2 - c__933124))
  }
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__6580 = s;
      var limit__6581 = limit;
      var parts__6582 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__6581, 1)) {
          return cljs.core.conj.call(null, parts__6582, s__6580)
        }else {
          var temp__3971__auto____6583 = cljs.core.re_find.call(null, re, s__6580);
          if(cljs.core.truth_(temp__3971__auto____6583)) {
            var m__6584 = temp__3971__auto____6583;
            var index__6585 = s__6580.indexOf(m__6584);
            var G__6586 = s__6580.substring(index__6585 + cljs.core.count.call(null, m__6584));
            var G__6587 = limit__6581 - 1;
            var G__6588 = cljs.core.conj.call(null, parts__6582, s__6580.substring(0, index__6585));
            s__6580 = G__6586;
            limit__6581 = G__6587;
            parts__6582 = G__6588;
            continue
          }else {
            return cljs.core.conj.call(null, parts__6582, s__6580)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__6592 = s.length;
  while(true) {
    if(index__6592 === 0) {
      return""
    }else {
      var ch__6593 = cljs.core._lookup.call(null, s, index__6592 - 1, null);
      if(function() {
        var or__3824__auto____6594 = cljs.core._EQ_.call(null, ch__6593, "\n");
        if(or__3824__auto____6594) {
          return or__3824__auto____6594
        }else {
          return cljs.core._EQ_.call(null, ch__6593, "\r")
        }
      }()) {
        var G__6595 = index__6592 - 1;
        index__6592 = G__6595;
        continue
      }else {
        return s.substring(0, index__6592)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__6599 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____6600 = cljs.core.not.call(null, s__6599);
    if(or__3824__auto____6600) {
      return or__3824__auto____6600
    }else {
      var or__3824__auto____6601 = cljs.core._EQ_.call(null, "", s__6599);
      if(or__3824__auto____6601) {
        return or__3824__auto____6601
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__6599)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__6608 = new goog.string.StringBuffer;
  var length__6609 = s.length;
  var index__6610 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__6609, index__6610)) {
      return buffer__6608.toString()
    }else {
      var ch__6611 = s.charAt(index__6610);
      var temp__3971__auto____6612 = cljs.core._lookup.call(null, cmap, ch__6611, null);
      if(cljs.core.truth_(temp__3971__auto____6612)) {
        var replacement__6613 = temp__3971__auto____6612;
        buffer__6608.append([cljs.core.str(replacement__6613)].join(""))
      }else {
        buffer__6608.append(ch__6611)
      }
      var G__6614 = index__6610 + 1;
      index__6610 = G__6614;
      continue
    }
    break
  }
};
goog.provide("webgl.shader.code");
goog.require("cljs.core");
goog.require("clojure.string");
webgl.shader.code.joiner = function joiner(delimeter) {
  return cljs.core.partial.call(null, clojure.string.join, delimeter)
};
webgl.shader.code.variadic = function variadic(f) {
  return cljs.core.comp.call(null, f, cljs.core.list)
};
webgl.shader.code.embracer = function embracer(open, close) {
  return function(p1__135626_SHARP_) {
    return[cljs.core.str(open), cljs.core.str(p1__135626_SHARP_), cljs.core.str(close)].join("")
  }
};
webgl.shader.code.encloser = function encloser(s) {
  return webgl.shader.code.embracer.call(null, s, s)
};
webgl.shader.code.applier = function applier(f) {
  return function() {
    var G__135628__delegate = function(rest__135627_SHARP_) {
      return cljs.core.apply.call(null, f, rest__135627_SHARP_)
    };
    var G__135628 = function(var_args) {
      var rest__135627_SHARP_ = null;
      if(goog.isDef(var_args)) {
        rest__135627_SHARP_ = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__135628__delegate.call(this, rest__135627_SHARP_)
    };
    G__135628.cljs$lang$maxFixedArity = 0;
    G__135628.cljs$lang$applyTo = function(arglist__135629) {
      var rest__135627_SHARP_ = cljs.core.seq(arglist__135629);
      return G__135628__delegate(rest__135627_SHARP_)
    };
    G__135628.cljs$lang$arity$variadic = G__135628__delegate;
    return G__135628
  }()
};
webgl.shader.code.concatter = function concatter(f) {
  return cljs.core.comp.call(null, f, webgl.shader.code.applier.call(null, cljs.core.concat))
};
webgl.shader.code.words = webgl.shader.code.joiner.call(null, " ");
webgl.shader.code.lines = webgl.shader.code.joiner.call(null, "\n");
webgl.shader.code.stars = webgl.shader.code.joiner.call(null, "*");
webgl.shader.code.words_STAR_ = webgl.shader.code.variadic.call(null, webgl.shader.code.words);
webgl.shader.code.lines_STAR_ = webgl.shader.code.variadic.call(null, webgl.shader.code.lines);
webgl.shader.code.stars_STAR_ = webgl.shader.code.variadic.call(null, webgl.shader.code.stars);
webgl.shader.code.braces = webgl.shader.code.embracer.call(null, "{", "}");
webgl.shader.code.enline = webgl.shader.code.encloser.call(null, "\n");
webgl.shader.code.block = cljs.core.comp.call(null, webgl.shader.code.braces, webgl.shader.code.enline);
webgl.shader.code.line_cat = webgl.shader.code.concatter.call(null, webgl.shader.code.lines);
webgl.shader.code.statement = function statement(x) {
  return[cljs.core.str(x), cljs.core.str(";")].join("")
};
webgl.shader.code.identifier = function identifier(prefix) {
  return cljs.core.name.call(null, cljs.core.gensym.call(null, cljs.core.name.call(null, prefix)))
};
webgl.shader.code.attribute_printer = function attribute_printer(key, type, name) {
  return webgl.shader.code.statement.call(null, webgl.shader.code.words.call(null, cljs.core.vector.call(null, key, type, name)))
};
webgl.shader.code.func = function func(name, body) {
  return webgl.shader.code.lines_STAR_.call(null, webgl.shader.code.words_STAR_.call(null, "void", [cljs.core.str(name), cljs.core.str("()")].join("")), webgl.shader.code.block.call(null, body))
};
webgl.shader.code.main = function main(code) {
  return webgl.shader.code.func.call(null, "main", webgl.shader.code.statement.call(null, webgl.shader.code.words.call(null, cljs.core.vector.call(null, "gl_Position", "=", code))))
};
webgl.shader.code.shader = function shader(declarations, out) {
  return webgl.shader.code.lines_STAR_.call(null, webgl.shader.code.lines.call(null, declarations), webgl.shader.code.main.call(null, out))
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.dependentDisposables_;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  if(!this.dependentDisposables_) {
    this.dependentDisposables_ = []
  }
  this.dependentDisposables_.push(disposable)
};
goog.Disposable.prototype.disposeInternal = function() {
  if(this.dependentDisposables_) {
    goog.disposeAll.apply(null, this.dependentDisposables_)
  }
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    if(goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable)
    }else {
      goog.dispose(disposable)
    }
  }
};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true
  }catch(e) {
  }
  return false
};
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      if(!goog.reflect.canAccessProperty(relatedTarget, "nodeName")) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.require("goog.asserts");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = false;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for(var i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.ASSUME_GOOD_GC = false;
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = {count_:0, remaining_:0}
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = {count_:0, remaining_:0};
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = [];
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.getProxy();
      proxy.src = src;
      listenerObj = new goog.events.Listener;
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = []
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.key, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = [];
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0
      }
      evt.dispose()
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("webgl.buffers");
goog.require("cljs.core");
goog.require("webgl.constants");
goog.require("webgl.api");
webgl.buffers.Buffer = function(type, id) {
  this.type = type;
  this.id = id
};
webgl.buffers.Buffer.cljs$lang$type = true;
webgl.buffers.Buffer.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "webgl.buffers/Buffer")
};
webgl.buffers.Buffer;
webgl.buffers.bind = function bind(buffer) {
  return webgl.api.bind_buffer.call(null, buffer.type, buffer.id)
};
webgl.buffers.make = function make(buffer_type, content) {
  var id__211133 = webgl.api.make_buffer.call(null);
  var buffer__211134 = new webgl.buffers.Buffer(buffer_type, id__211133);
  webgl.buffers.bind.call(null, buffer__211134);
  webgl.api.buffer_data.call(null, buffer_type, content);
  return buffer__211134
};
webgl.buffers.as_bindable = cljs.core.constantly;
goog.provide("webgl.matrix");
goog.require("cljs.core");
webgl.matrix.x_rotation = function x_rotation(angle) {
  return function(frame) {
    var angle__229357 = angle.call(null, frame);
    return[1, 0, 0, 0, 0, Math.cos(angle__229357), -Math.sin(angle__229357), 0, 0, Math.sin(angle__229357), Math.cos(angle__229357), 0, 0, 0, 0, 1]
  }
};
webgl.matrix.y_rotation = function y_rotation(angle) {
  return function(frame) {
    var angle__229359 = angle.call(null, frame);
    return[Math.cos(angle__229359), 0, Math.sin(angle__229359), 0, 0, 1, 0, 0, -Math.sin(angle__229359), 0, Math.cos(angle__229359), 0, 0, 0, 0, 1]
  }
};
webgl.matrix.z_rotation = function z_rotation(angle) {
  return function(frame) {
    var angle__229361 = angle.call(null, frame);
    return[Math.cos(angle__229361), -Math.sin(angle__229361), 0, 0, Math.sin(angle__229361), Math.cos(angle__229361), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  }
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            if(goog.string.startsWith(key, "aria-")) {
              element.setAttribute(key, val)
            }else {
              element[key] = val
            }
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    var child = root.firstChild;
    while(child) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
      child = child.nextSibling
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0 && index < 32768
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement
  }catch(e) {
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("webgl.shader");
goog.require("cljs.core");
goog.require("webgl.shader.code");
goog.require("webgl.buffers");
goog.require("webgl.api");
webgl.shader.GLSLType = {};
webgl.shader.type_name = function type_name(_) {
  if(function() {
    var and__3822__auto____225753 = _;
    if(and__3822__auto____225753) {
      return _.webgl$shader$GLSLType$type_name$arity$1
    }else {
      return and__3822__auto____225753
    }
  }()) {
    return _.webgl$shader$GLSLType$type_name$arity$1(_)
  }else {
    var x__2363__auto____225754 = _ == null ? null : _;
    return function() {
      var or__3824__auto____225755 = webgl.shader.type_name[goog.typeOf(x__2363__auto____225754)];
      if(or__3824__auto____225755) {
        return or__3824__auto____225755
      }else {
        var or__3824__auto____225756 = webgl.shader.type_name["_"];
        if(or__3824__auto____225756) {
          return or__3824__auto____225756
        }else {
          throw cljs.core.missing_protocol.call(null, "GLSLType.type-name", _);
        }
      }
    }().call(null, _)
  }
};
webgl.shader.Declare = {};
webgl.shader.declare = function declare(_) {
  if(function() {
    var and__3822__auto____225761 = _;
    if(and__3822__auto____225761) {
      return _.webgl$shader$Declare$declare$arity$1
    }else {
      return and__3822__auto____225761
    }
  }()) {
    return _.webgl$shader$Declare$declare$arity$1(_)
  }else {
    var x__2363__auto____225762 = _ == null ? null : _;
    return function() {
      var or__3824__auto____225763 = webgl.shader.declare[goog.typeOf(x__2363__auto____225762)];
      if(or__3824__auto____225763) {
        return or__3824__auto____225763
      }else {
        var or__3824__auto____225764 = webgl.shader.declare["_"];
        if(or__3824__auto____225764) {
          return or__3824__auto____225764
        }else {
          throw cljs.core.missing_protocol.call(null, "Declare.declare", _);
        }
      }
    }().call(null, _)
  }
};
webgl.shader.Compile = {};
webgl.shader.compile = function compile(_) {
  if(function() {
    var and__3822__auto____225769 = _;
    if(and__3822__auto____225769) {
      return _.webgl$shader$Compile$compile$arity$1
    }else {
      return and__3822__auto____225769
    }
  }()) {
    return _.webgl$shader$Compile$compile$arity$1(_)
  }else {
    var x__2363__auto____225770 = _ == null ? null : _;
    return function() {
      var or__3824__auto____225771 = webgl.shader.compile[goog.typeOf(x__2363__auto____225770)];
      if(or__3824__auto____225771) {
        return or__3824__auto____225771
      }else {
        var or__3824__auto____225772 = webgl.shader.compile["_"];
        if(or__3824__auto____225772) {
          return or__3824__auto____225772
        }else {
          throw cljs.core.missing_protocol.call(null, "Compile.compile", _);
        }
      }
    }().call(null, _)
  }
};
webgl.shader.Bind = {};
webgl.shader.bind = function bind(_, program, frame) {
  if(function() {
    var and__3822__auto____225777 = _;
    if(and__3822__auto____225777) {
      return _.webgl$shader$Bind$bind$arity$3
    }else {
      return and__3822__auto____225777
    }
  }()) {
    return _.webgl$shader$Bind$bind$arity$3(_, program, frame)
  }else {
    var x__2363__auto____225778 = _ == null ? null : _;
    return function() {
      var or__3824__auto____225779 = webgl.shader.bind[goog.typeOf(x__2363__auto____225778)];
      if(or__3824__auto____225779) {
        return or__3824__auto____225779
      }else {
        var or__3824__auto____225780 = webgl.shader.bind["_"];
        if(or__3824__auto____225780) {
          return or__3824__auto____225780
        }else {
          throw cljs.core.missing_protocol.call(null, "Bind.bind", _);
        }
      }
    }().call(null, _, program, frame)
  }
};
webgl.shader.ToAttribute = {};
webgl.shader.to_attribute = function to_attribute(_, location, val) {
  if(function() {
    var and__3822__auto____225785 = _;
    if(and__3822__auto____225785) {
      return _.webgl$shader$ToAttribute$to_attribute$arity$3
    }else {
      return and__3822__auto____225785
    }
  }()) {
    return _.webgl$shader$ToAttribute$to_attribute$arity$3(_, location, val)
  }else {
    var x__2363__auto____225786 = _ == null ? null : _;
    return function() {
      var or__3824__auto____225787 = webgl.shader.to_attribute[goog.typeOf(x__2363__auto____225786)];
      if(or__3824__auto____225787) {
        return or__3824__auto____225787
      }else {
        var or__3824__auto____225788 = webgl.shader.to_attribute["_"];
        if(or__3824__auto____225788) {
          return or__3824__auto____225788
        }else {
          throw cljs.core.missing_protocol.call(null, "ToAttribute.to-attribute", _);
        }
      }
    }().call(null, _, location, val)
  }
};
webgl.shader.ToUniform = {};
webgl.shader.to_uniform = function to_uniform(_, location, val) {
  if(function() {
    var and__3822__auto____225793 = _;
    if(and__3822__auto____225793) {
      return _.webgl$shader$ToUniform$to_uniform$arity$3
    }else {
      return and__3822__auto____225793
    }
  }()) {
    return _.webgl$shader$ToUniform$to_uniform$arity$3(_, location, val)
  }else {
    var x__2363__auto____225794 = _ == null ? null : _;
    return function() {
      var or__3824__auto____225795 = webgl.shader.to_uniform[goog.typeOf(x__2363__auto____225794)];
      if(or__3824__auto____225795) {
        return or__3824__auto____225795
      }else {
        var or__3824__auto____225796 = webgl.shader.to_uniform["_"];
        if(or__3824__auto____225796) {
          return or__3824__auto____225796
        }else {
          throw cljs.core.missing_protocol.call(null, "ToUniform.to-uniform", _);
        }
      }
    }().call(null, _, location, val)
  }
};
webgl.shader.AttributeBinder = {};
webgl.shader.attribute_binder = function attribute_binder(_) {
  if(function() {
    var and__3822__auto____225801 = _;
    if(and__3822__auto____225801) {
      return _.webgl$shader$AttributeBinder$attribute_binder$arity$1
    }else {
      return and__3822__auto____225801
    }
  }()) {
    return _.webgl$shader$AttributeBinder$attribute_binder$arity$1(_)
  }else {
    var x__2363__auto____225802 = _ == null ? null : _;
    return function() {
      var or__3824__auto____225803 = webgl.shader.attribute_binder[goog.typeOf(x__2363__auto____225802)];
      if(or__3824__auto____225803) {
        return or__3824__auto____225803
      }else {
        var or__3824__auto____225804 = webgl.shader.attribute_binder["_"];
        if(or__3824__auto____225804) {
          return or__3824__auto____225804
        }else {
          throw cljs.core.missing_protocol.call(null, "AttributeBinder.attribute-binder", _);
        }
      }
    }().call(null, _)
  }
};
webgl.buffers.Buffer.prototype.webgl$shader$AttributeBinder$ = true;
webgl.buffers.Buffer.prototype.webgl$shader$AttributeBinder$attribute_binder$arity$1 = function(this$) {
  return function(location, size, val) {
    webgl.buffers.bind.call(null, this$);
    webgl.api.vertex_attribute_pointer.call(null, location, size, "\ufdd0'float", false, 0, 0);
    return webgl.api.enable_vertex_attribute_array.call(null, location)
  }
};
webgl.shader.Vec4 = function() {
};
webgl.shader.Vec4.cljs$lang$type = true;
webgl.shader.Vec4.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "webgl.shader/Vec4")
};
webgl.shader.Vec4.prototype.webgl$shader$ToAttribute$ = true;
webgl.shader.Vec4.prototype.webgl$shader$ToAttribute$to_attribute$arity$3 = function(_, location, val) {
  var this__225805 = this;
  var binder__225806 = webgl.shader.attribute_binder.call(null, val);
  return binder__225806.call(null, location, 3, val)
};
webgl.shader.Vec4.prototype.webgl$shader$GLSLType$ = true;
webgl.shader.Vec4.prototype.webgl$shader$GLSLType$type_name$arity$1 = function(_) {
  var this__225807 = this;
  return"vec4"
};
webgl.shader.Vec4;
webgl.shader.Mat4 = function() {
};
webgl.shader.Mat4.cljs$lang$type = true;
webgl.shader.Mat4.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "webgl.shader/Mat4")
};
webgl.shader.Mat4.prototype.webgl$shader$ToUniform$ = true;
webgl.shader.Mat4.prototype.webgl$shader$ToUniform$to_uniform$arity$3 = function(_, location, value) {
  var this__225808 = this;
  return webgl.api.uniform_matrix.call(null, location, value)
};
webgl.shader.Mat4.prototype.webgl$shader$GLSLType$ = true;
webgl.shader.Mat4.prototype.webgl$shader$GLSLType$type_name$arity$1 = function(_) {
  var this__225809 = this;
  return"mat4"
};
webgl.shader.Mat4;
webgl.shader.vec4 = new webgl.shader.Vec4;
webgl.shader.mat4 = new webgl.shader.Mat4;
webgl.shader.Attribute = function(type, name, printer, value_fn) {
  this.type = type;
  this.name = name;
  this.printer = printer;
  this.value_fn = value_fn
};
webgl.shader.Attribute.cljs$lang$type = true;
webgl.shader.Attribute.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "webgl.shader/Attribute")
};
webgl.shader.Attribute.prototype.webgl$shader$Bind$ = true;
webgl.shader.Attribute.prototype.webgl$shader$Bind$bind$arity$3 = function(_, prog, frame) {
  var this__225810 = this;
  var location__225811 = webgl.api.attribute_location.call(null, prog, this__225810.name);
  var value__225812 = this__225810.value_fn.call(null, frame);
  return webgl.shader.to_attribute.call(null, this__225810.type, location__225811, value__225812)
};
webgl.shader.Attribute.prototype.webgl$shader$Compile$ = true;
webgl.shader.Attribute.prototype.webgl$shader$Compile$compile$arity$1 = function(_) {
  var this__225813 = this;
  return this__225813.name
};
webgl.shader.Attribute.prototype.webgl$shader$Declare$ = true;
webgl.shader.Attribute.prototype.webgl$shader$Declare$declare$arity$1 = function(_) {
  var this__225814 = this;
  return this__225814.printer.call(null, "attribute", webgl.shader.type_name.call(null, this__225814.type), this__225814.name)
};
webgl.shader.Attribute;
webgl.shader.Uniform = function(type, name, printer, value_fn) {
  this.type = type;
  this.name = name;
  this.printer = printer;
  this.value_fn = value_fn
};
webgl.shader.Uniform.cljs$lang$type = true;
webgl.shader.Uniform.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "webgl.shader/Uniform")
};
webgl.shader.Uniform.prototype.webgl$shader$Bind$ = true;
webgl.shader.Uniform.prototype.webgl$shader$Bind$bind$arity$3 = function(_, prog, frame) {
  var this__225815 = this;
  var location__225816 = webgl.api.uniform_location.call(null, prog, this__225815.name);
  var value__225817 = this__225815.value_fn.call(null, frame);
  return webgl.shader.to_uniform.call(null, this__225815.type, location__225816, value__225817)
};
webgl.shader.Uniform.prototype.webgl$shader$Compile$ = true;
webgl.shader.Uniform.prototype.webgl$shader$Compile$compile$arity$1 = function(_) {
  var this__225818 = this;
  return this__225818.name
};
webgl.shader.Uniform.prototype.webgl$shader$Declare$ = true;
webgl.shader.Uniform.prototype.webgl$shader$Declare$declare$arity$1 = function(_) {
  var this__225819 = this;
  return this__225819.printer.call(null, "uniform", webgl.shader.type_name.call(null, this__225819.type), this__225819.name)
};
webgl.shader.Uniform;
webgl.shader.attribute = function attribute(type, value_fn) {
  return new webgl.shader.Attribute(type, webgl.shader.code.identifier.call(null, "\ufdd0'attribute"), webgl.shader.code.attribute_printer, value_fn)
};
webgl.shader.uniform = function uniform(type, value_fn) {
  return new webgl.shader.Uniform(type, webgl.shader.code.identifier.call(null, "\ufdd0'uniform"), webgl.shader.code.attribute_printer, value_fn)
};
webgl.shader.Multiply = function(args) {
  this.args = args
};
webgl.shader.Multiply.cljs$lang$type = true;
webgl.shader.Multiply.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "webgl.shader/Multiply")
};
webgl.shader.Multiply.prototype.webgl$shader$Compile$ = true;
webgl.shader.Multiply.prototype.webgl$shader$Compile$compile$arity$1 = function(_) {
  var this__225820 = this;
  return webgl.shader.code.stars.call(null, cljs.core.map.call(null, webgl.shader.compile, this__225820.args))
};
webgl.shader.Multiply;
webgl.shader._STAR_ = function() {
  var _STAR___delegate = function(args) {
    return new webgl.shader.Multiply(args)
  };
  var _STAR_ = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return _STAR___delegate.call(this, args)
  };
  _STAR_.cljs$lang$maxFixedArity = 0;
  _STAR_.cljs$lang$applyTo = function(arglist__225821) {
    var args = cljs.core.seq(arglist__225821);
    return _STAR___delegate(args)
  };
  _STAR_.cljs$lang$arity$variadic = _STAR___delegate;
  return _STAR_
}();
webgl.shader.Shader = function(attributes, out) {
  this.attributes = attributes;
  this.out = out
};
webgl.shader.Shader.cljs$lang$type = true;
webgl.shader.Shader.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "webgl.shader/Shader")
};
webgl.shader.Shader.prototype.webgl$shader$Bind$ = true;
webgl.shader.Shader.prototype.webgl$shader$Bind$bind$arity$3 = function(_, prog, frame) {
  var this__225822 = this;
  var G__225823__225824 = cljs.core.seq.call(null, this__225822.attributes);
  if(G__225823__225824) {
    var attribute__225825 = cljs.core.first.call(null, G__225823__225824);
    var G__225823__225826 = G__225823__225824;
    while(true) {
      webgl.shader.bind.call(null, attribute__225825, prog, frame);
      var temp__3974__auto____225827 = cljs.core.next.call(null, G__225823__225826);
      if(temp__3974__auto____225827) {
        var G__225823__225828 = temp__3974__auto____225827;
        var G__225830 = cljs.core.first.call(null, G__225823__225828);
        var G__225831 = G__225823__225828;
        attribute__225825 = G__225830;
        G__225823__225826 = G__225831;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
webgl.shader.Shader.prototype.webgl$shader$Compile$ = true;
webgl.shader.Shader.prototype.webgl$shader$Compile$compile$arity$1 = function(_) {
  var this__225829 = this;
  return webgl.shader.code.shader.call(null, cljs.core.map.call(null, webgl.shader.declare, this__225829.attributes), webgl.shader.compile.call(null, this__225829.out))
};
webgl.shader.Shader;
webgl.shader.shader = function shader(attributes, out) {
  return new webgl.shader.Shader(attributes, out)
};
goog.provide("webgl.core");
goog.require("cljs.core");
goog.require("webgl.shader");
goog.require("webgl.scalar");
goog.require("webgl.program");
goog.require("webgl.matrix");
goog.require("webgl.constants");
goog.require("webgl.buffers");
goog.require("webgl.api");
goog.require("goog.events");
goog.require("goog.dom");
webgl.core.fps = 30;
webgl.core.triangle = [0, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0];
webgl.core.time = webgl.scalar.time.call(null, webgl.core.fps);
webgl.core.fragment_code = "precision mediump float;\n   void main()\n   {\n     gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n   }";
webgl.core.frame = cljs.core.atom.call(null, 0);
webgl.core.redraw = cljs.core.atom.call(null, true);
webgl.core.next_frame = function next_frame() {
  if(cljs.core.truth_(cljs.core.deref.call(null, webgl.core.redraw))) {
    return cljs.core.swap_BANG_.call(null, webgl.core.frame, cljs.core.inc)
  }else {
    return null
  }
};
webgl.core.render_frame = function render_frame(program, vertex_shader, frame) {
  webgl.shader.bind.call(null, vertex_shader, program, frame);
  webgl.api.clear.call(null, "\ufdd0'color-buffer");
  return webgl.api.draw_arrays.call(null, "\ufdd0'triangles", 0, 3)
};
webgl.core.render = function render(gl, f) {
  if(cljs.core.truth_(cljs.core.deref.call(null, webgl.core.redraw))) {
    window.requestAnimFrame(cljs.core.partial.call(null, render, gl, f), gl.canvas);
    return webgl.api.with_context.call(null, gl, f, cljs.core.deref.call(null, webgl.core.frame))
  }else {
    return null
  }
};
webgl.core.prepare_program = function prepare_program(program, vertex_shader) {
  webgl.program.attach_BANG_.call(null, program, "\ufdd0'vertex", webgl.shader.compile.call(null, vertex_shader));
  webgl.program.attach_BANG_.call(null, program, "\ufdd0'fragment", webgl.core.fragment_code);
  webgl.program.link_BANG_.call(null, program);
  return webgl.program.use_BANG_.call(null, program)
};
webgl.core.model_view_shader = function model_view_shader(vertices, view) {
  return webgl.shader.shader.call(null, cljs.core.vector.call(null, vertices, view), webgl.shader._STAR_.call(null, vertices, view))
};
webgl.core.init_scene = function init_scene(canvas) {
  var program__222172 = webgl.program.make.call(null);
  webgl.api.clear_color.call(null, 0, 0, 0, 1);
  var gl__222173 = webgl.api.context.call(null);
  var buffer__222174 = webgl.buffers.make.call(null, "\ufdd0'array", webgl.core.triangle);
  var vertices__222175 = webgl.shader.attribute.call(null, webgl.shader.vec4, webgl.buffers.as_bindable.call(null, buffer__222174));
  var view__222176 = webgl.shader.uniform.call(null, webgl.shader.mat4, webgl.matrix.z_rotation.call(null, webgl.scalar.scale.call(null, webgl.scalar.easing.call(null, webgl.scalar.sin.call(null, webgl.core.time), webgl.scalar.quadratic), Math.PI)));
  var vertex_shader__222177 = webgl.core.model_view_shader.call(null, vertices__222175, view__222176);
  var renderer__222178 = cljs.core.partial.call(null, webgl.core.render_frame, program__222172, vertex_shader__222177);
  webgl.core.prepare_program.call(null, program__222172, vertex_shader__222177);
  setInterval(webgl.core.next_frame, 1E3 / webgl.core.fps);
  webgl.core.render.call(null, gl__222173, renderer__222178);
  return goog.events.listen(canvas, "click", function(evt) {
    cljs.core.swap_BANG_.call(null, webgl.core.redraw, cljs.core.not);
    if(cljs.core.truth_(cljs.core.deref.call(null, webgl.core.redraw))) {
      return webgl.core.render.call(null, gl__222173, renderer__222178)
    }else {
      return null
    }
  })
};
webgl.core.load_gl = function load_gl() {
  var canvas__222180 = goog.dom.$("gl");
  return webgl.api.with_context.call(null, webgl.api.make_context.call(null, canvas__222180), webgl.core.init_scene, canvas__222180)
};
webgl.core.init = function init() {
  return window.onload = webgl.core.load_gl
};
goog.exportSymbol("webgl.core.init", webgl.core.init);

#include <node.h>
#include <node_buffer.h>
#include <nan.h>
#include <uv.h>
#include "storj.h"

using namespace v8;
using namespace Nan;

void Timestamp(const v8::FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    uint64_t timestamp = storj_util_timestamp();
    Local<Number> timestamp_local = Number::New(isolate, timestamp);

    args.GetReturnValue().Set(timestamp_local);
}

void MnemonicCheck(const v8::FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    String::Utf8Value str(args[0]);
    const char *mnemonic = *str;

    bool mnemonic_check_result = storj_mnemonic_check(mnemonic);
    Local<Boolean> mnemonic_check_result_local = Boolean::New(isolate, mnemonic_check_result);

    args.GetReturnValue().Set(mnemonic_check_result_local);
}

void GetInfoCallback(uv_work_t *work_req, int status) {
    Nan::HandleScope scope;

    json_request_t *req = (json_request_t *) work_req->data;

    Nan::Callback *callback = (Nan::Callback*)req->handle;

    const char *result_str = json_object_to_json_string(req->response);

    Local<Value> argv[] = {
        Nan::Null(),
        v8::JSON::Parse(Nan::New(result_str).ToLocalChecked())
    };

    callback->Call(2, argv);
    free(req);
    free(work_req);
}

void GetInfo(const Nan::FunctionCallbackInfo<Value>& args) {
    Isolate *isolate = args.GetIsolate();

    if (args.This()->InternalFieldCount() != 1)
    {
        Nan::ThrowError("Environment not available for instance");
    }

    storj_env_t *env = (storj_env_t *)args.This()->GetAlignedPointerFromInternalField(0);

    Nan::Callback *callback = new Nan::Callback(args[0].As<Function>());

    storj_bridge_get_info(env, (void *) callback, GetInfoCallback);
}

void Environment(const v8::FunctionCallbackInfo<Value>& args) {
    Nan::EscapableHandleScope scope;

    v8::Local<v8::Object> options = args[0].As<v8::Object>();

    v8::Local<v8::String> bridgeUrl = options->Get(Nan::New("bridgeUrl").ToLocalChecked()).As<v8::String>();
    v8::Local<v8::String> bridgeUser = options->Get(Nan::New("bridgeUser").ToLocalChecked()).As<v8::String>();
    v8::Local<v8::String> bridgePass = options->Get(Nan::New("bridgePass").ToLocalChecked()).As<v8::String>();
    v8::Local<v8::String> encryptionKey = options->Get(Nan::New("encryptionKey").ToLocalChecked()).As<v8::String>();

    v8::Local<v8::FunctionTemplate> constructor = Nan::New<v8::FunctionTemplate>();
    constructor->SetClassName(Nan::New("Environment").ToLocalChecked());
    constructor->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::SetPrototypeMethod(constructor, "getInfo", GetInfo);

    Nan::MaybeLocal<v8::Object> maybeInstance;
    v8::Local<v8::Object> instance;

    v8::Local<v8::Value> argv[] = {};
    maybeInstance = Nan::NewInstance(constructor->GetFunction(), 0, argv);

    if (maybeInstance.IsEmpty()) {
        Nan::ThrowError("Could not create new Storj instance");
    } else {
        instance = maybeInstance.ToLocalChecked();
    }

    // Bridge URL handling

    String::Utf8Value _bridgeUrl(bridgeUrl);
    const char *url = *_bridgeUrl;
    char proto[6];
    char host[100];
    int port = 0;
    sscanf(url, "%5[^://]://%99[^:/]:%99d", proto, host, &port);
    if (port == 0) {
        if (strcmp(proto, "http") == 0) {
            port = 80;
        } else {
            port = 443;
        }
    }

    // V8 types to C types

    String::Utf8Value _bridgeUser(bridgeUser);
    const char *user = *_bridgeUser;
    String::Utf8Value _bridgePass(bridgePass);
    const char *pass = *_bridgePass;
    String::Utf8Value _encryptionKey(encryptionKey);
    const char *mnemonic = *_encryptionKey;

    // Setup option structs

    storj_bridge_options_t bridge_options = {};
    bridge_options.proto = proto;
    bridge_options.host  = host;
    bridge_options.port  = port;
    bridge_options.user  = user;
    bridge_options.pass  = pass;

    storj_encrypt_options_t encrypt_options = {};
    encrypt_options.mnemonic = mnemonic;

    storj_http_options_t http_options = {};
    http_options.user_agent = "storj-test";
    http_options.low_speed_limit = STORJ_LOW_SPEED_LIMIT;
    http_options.low_speed_time = STORJ_LOW_SPEED_TIME;
    http_options.timeout = STORJ_HTTP_TIMEOUT;

    storj_log_options_t log_options = {};
    log_options.logger = NULL;
    log_options.level = 0;

    // Initialize environment

    storj_env_t *env = storj_init_env(&bridge_options,
                                      &encrypt_options,
                                      &http_options,
                                      &log_options);

    // Use Node.js default event loop that will already be running
    env->loop = uv_default_loop();

    // Pass along the environment so it can be accessed by methods
    instance->SetAlignedPointerInInternalField(0, env);

    args.GetReturnValue().Set(scope.Escape(instance));
}

void init(Handle<Object> exports) {
    NODE_SET_METHOD(exports, "Environment", Environment);
    NODE_SET_METHOD(exports, "utilTimestamp", Timestamp);
    NODE_SET_METHOD(exports, "mnemonicCheck", MnemonicCheck);
}

NODE_MODULE(storj, init);

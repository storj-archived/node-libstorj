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

  Nan::Callback *callback = new Nan::Callback(args[0].As<Function>());

  storj_bridge_options_t bridge_options = {};
  bridge_options.proto = "https";
  bridge_options.host  = "api.storj.io";
  bridge_options.port  = 443;
  bridge_options.user  = "testuser@storj.io";
  bridge_options.pass  = "dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04";

  storj_encrypt_options_t encrypt_options = {};
  encrypt_options.mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  storj_http_options_t http_options = {};
  http_options.user_agent = "storj-test";
  http_options.low_speed_limit = 0;
  http_options.low_speed_time = 0;
  http_options.timeout = 3;

  storj_log_options_t log_options = {};
  log_options.level = 0;

  storj_env_t *env = storj_init_env(&bridge_options,
                                    &encrypt_options,
                                    &http_options,
                                    &log_options);

  env->loop = uv_default_loop();
  storj_bridge_get_info(env, (void *) callback, GetInfoCallback);
}

void Environment(const v8::FunctionCallbackInfo<Value>& args) {
    Nan::EscapableHandleScope scope;

    v8::Local<v8::FunctionTemplate> constructor = Nan::New<v8::FunctionTemplate>();
    constructor->SetClassName(Nan::New("Storj").ToLocalChecked());

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

    args.GetReturnValue().Set(scope.Escape(instance));
}

void init(Handle<Object> exports) {
    NODE_SET_METHOD(exports, "Environment", Environment);
    NODE_SET_METHOD(exports, "utilTimestamp", Timestamp);
    NODE_SET_METHOD(exports, "mnemonicCheck", MnemonicCheck);
}

NODE_MODULE(storj, init);

#include <node.h>
#include <node_buffer.h>
#include <nan.h>
#include <uv.h>
#include "storj.h"

using namespace v8;
using namespace node;

void Timestamp(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    uint64_t timestamp = storj_util_timestamp();
    Local<Number> timestamp_local = Number::New(isolate, timestamp);

    args.GetReturnValue().Set(timestamp_local);
}

void MnemonicCheck(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    String::Utf8Value str(args[0]);
    const char *mnemonic = *str;

    bool mnemonic_check_result = storj_mnemonic_check(mnemonic);
    Local<Boolean> mnemonic_check_result_local = Boolean::New(isolate, mnemonic_check_result);

    args.GetReturnValue().Set(mnemonic_check_result_local);
}

void GetInfoCb(uv_work_t *work_req, int status) {
    json_request_t *req = (json_request_t *) work_req->data;

    FunctionCallbackInfo<Value>& args = (FunctionCallbackInfo<Value>&) *req->handle;
    Isolate *isolate = args.GetIsolate();

    Local<Function> cb = Local<Function>::Cast(args[0]);

    const char *result_str = json_object_to_json_string(req->response);

    const unsigned argc = 2;
    Local<Value> argv[argc] = {
      Number::New(isolate, status),
      JSON::Parse(String::NewFromUtf8(isolate, result_str))
    };


    cb->Call(Null(isolate), argc, argv);
    free(req);
    free(work_req);
}

void GetInfo(const FunctionCallbackInfo<Value>& args) {
  storj_bridge_options_t bridge_options = {
      .proto = "https",
      .host  = "api.storj.io",
      .port  = 443,
      .user  = "testuser@storj.io",
      .pass  = "dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04"
  };


  storj_encrypt_options_t encrypt_options = {
      .mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
  };

  storj_http_options_t http_options = {
      .user_agent = "storj-test",
      .low_speed_limit = 0,
      .low_speed_time = 0,
      .timeout = 3
  };

  storj_log_options_t log_options = {
      .level = 0
  };

  storj_env_t *env = storj_init_env(&bridge_options,
                                    &encrypt_options,
                                    &http_options,
                                    &log_options);

  storj_bridge_get_info(env, (void *) &args, GetInfoCb);
  uv_run(env->loop, UV_RUN_DEFAULT);
}

void init(Handle<Object> exports) {
    NODE_SET_METHOD(exports, "utilTimestamp", Timestamp);
    NODE_SET_METHOD(exports, "mnemonicCheck", MnemonicCheck);
    NODE_SET_METHOD(exports, "getInfo", GetInfo);
}

NODE_MODULE(bitcoinconsensus, init);

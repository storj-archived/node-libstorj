#include <node.h>
#include <node_buffer.h>
#include <nan.h>
#include <uv.h>
#include "storj.h"

using namespace v8;
using namespace node;

const char *ToCString(const String::Utf8Value& value) {
  return *value ? *value : "<string conversion failed>";
}

void Timestamp(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    uint64_t timestamp = storj_util_timestamp();
    Local<Number> timestamp_local = Number::New(isolate, timestamp);

    args.GetReturnValue().Set(timestamp_local);
}

void MnemonicCheck(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    String::Utf8Value str(args[0]);
    const char *mnemonic = ToCString(str);

    bool mnemonic_check_result = storj_mnemonic_check(mnemonic);
    Local<Boolean> mnemonic_check_result_local = Boolean::New(isolate, mnemonic_check_result);

    args.GetReturnValue().Set(mnemonic_check_result_local);
}

void init(Handle<Object> exports) {
    NODE_SET_METHOD(exports, "util_timestamp", Timestamp);
    NODE_SET_METHOD(exports, "mnemonic_check", MnemonicCheck);
}

NODE_MODULE(bitcoinconsensus, init);

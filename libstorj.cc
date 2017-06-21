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

void init(Handle<Object> exports) {
    NODE_SET_METHOD(exports, "util_timestamp", Timestamp);
}

NODE_MODULE(bitcoinconsensus, init);

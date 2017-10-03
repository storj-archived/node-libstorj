#include <node.h>
#include <node_buffer.h>
#include <nan.h>
#include <uv.h>
#include "storj.h"

using namespace v8;
using namespace Nan;

typedef struct {
    Nan::Callback *progress_callback;
    Nan::Callback *finished_callback;
} transfer_callbacks_t;

extern "C" void JsonLogger(const char *message, int level, void *handle) {
    printf("{\"message\": \"%s\", \"level\": %i, \"timestamp\": %" PRIu64 "}\n",
           message, level, storj_util_timestamp());
}

Local<Value> IntToStorjError(int error_code) {
    if (!error_code) {
        return Nan::Null();
    }

    const char* error_msg = storj_strerror(error_code);
    v8::Local<v8::String> msg = Nan::New(error_msg).ToLocalChecked();
    v8::Local<v8::Value> error = Nan::Error(msg);

    return error;
}

Local<Value> IntToCurlError(int error_code) {
    const char* error_msg = curl_easy_strerror((CURLcode)error_code);
    v8::Local<v8::String> msg = Nan::New(error_msg).ToLocalChecked();
    return Nan::Error(msg);
}

Local<Value> IntToStatusError(int status_code) {
    Local<String> error_message;
    switch(status_code) {
        case 400:
            error_message = Nan::New("Bad request").ToLocalChecked();
            break;
        case 401:
            error_message = Nan::New("Not authorized").ToLocalChecked();
            break;
        case 404:
            error_message = Nan::New("Resource not found").ToLocalChecked();
            break;
        case 420:
            error_message = Nan::New("Transfer rate limit").ToLocalChecked();
            break;
        case 429:
            error_message = Nan::New("Request rate limited").ToLocalChecked();
            break;
        case 500:
            error_message = Nan::New("Internal error").ToLocalChecked();
            break;
        case 501:
            error_message = Nan::New("Not implemented").ToLocalChecked();
            break;
        case 503:
            error_message = Nan::New("Service unavailable").ToLocalChecked();
            break;
        default:
            error_message = Nan::New("Unknown status error").ToLocalChecked();
    }
    Local<Value> error = Nan::Error(error_message);
    return error;
}

template <typename ReqType>
bool error_and_status_check(ReqType *req, Local<Value> *error) {
    if (req->error_code) {
        *error = IntToCurlError(req->error_code);
    } else if (req->status_code > 399) {
        *error = IntToStatusError(req->status_code);
    } else {
        return true;
    }

    return false;
}

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

void MnemonicGenerate(const v8::FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    char *mnemonic_result = NULL;
    int32_t strength = Nan::To<int32_t>(args[0]).FromJust();

    storj_mnemonic_generate(strength, &mnemonic_result);
    Local<String> mnemonic_local = String::NewFromUtf8(isolate, mnemonic_result);

    free(mnemonic_result);
    args.GetReturnValue().Set(mnemonic_local);
}

void GetInfoCallback(uv_work_t *work_req, int status) {
    Nan::HandleScope scope;

    json_request_t *req = (json_request_t *) work_req->data;

    Nan::Callback *callback = (Nan::Callback*)req->handle;

    v8::Local<v8::Value> error = Nan::Null();
    v8::Local<Value> result = Nan::Null();

    if (error_and_status_check<json_request_t>(req, &error)) {
        const char *result_str = json_object_to_json_string(req->response);
        v8::Local<v8::String> result_json_string = Nan::New(result_str).ToLocalChecked();
        Nan::JSON NanJSON;
        Nan::MaybeLocal<v8::Value> res = NanJSON.Parse(result_json_string);
        if (!res.IsEmpty()) {
            result = res.ToLocalChecked();
        }
    }

    Local<Value> argv[] = {
        error,
        result
    };

    callback->Call(2, argv);
    free(req);
    free(work_req);
}

void GetInfo(const Nan::FunctionCallbackInfo<Value>& args) {
    if (args.This()->InternalFieldCount() != 1) {
        return Nan::ThrowError("Environment not available for instance");
    }

    storj_env_t *env = (storj_env_t *)args.This()->GetAlignedPointerFromInternalField(0);
    if (!env) {
        return Nan::ThrowError("Environment is not initialized");
    }

    Nan::Callback *callback = new Nan::Callback(args[0].As<Function>());

    storj_bridge_get_info(env, (void *) callback, GetInfoCallback);
}

Local<Date> StrToDate(const char *dateStr) {
    Local<Date> tmp = Nan::New<Date>(0).ToLocalChecked();
    v8::Local<v8::Function> cons = v8::Local<v8::Function>::Cast(
        Nan::Get(tmp, Nan::New("constructor").ToLocalChecked()).ToLocalChecked()
    );
    const int argc = 1;
    v8::Local<v8::Value> argv[argc] = {Nan::New(dateStr).ToLocalChecked()};
    v8::Local<v8::Date> date = v8::Local<v8::Date>::Cast(
        Nan::NewInstance(cons, argc, argv).ToLocalChecked()
    );
    return date;
}

void GetBucketsCallback(uv_work_t *work_req, int status) {
    Nan::HandleScope scope;

    get_buckets_request_t *req = (get_buckets_request_t *) work_req->data;

    Nan::Callback *callback = (Nan::Callback*)req->handle;
    Local<Value> buckets_value = Nan::Null();
    Local<Value> error = Nan::Null();

    if (error_and_status_check<get_buckets_request_t>(req, &error)) {
        Local<Array> buckets_array = Nan::New<Array>();
        for (uint8_t i=0; i<req->total_buckets; i++) {
            Local<Object> bucket = Nan::New<Object>();
            bucket->Set(Nan::New("name").ToLocalChecked(), Nan::New(req->buckets[i].name).ToLocalChecked());
            bucket->Set(Nan::New("created").ToLocalChecked(), StrToDate(req->buckets[i].created));
            bucket->Set(Nan::New("id").ToLocalChecked(), Nan::New(req->buckets[i].id).ToLocalChecked());
            bucket->Set(Nan::New("decrypted").ToLocalChecked(), Nan::New<Boolean>(req->buckets[i].decrypted));
            buckets_array->Set(i, bucket);
        }
        buckets_value = buckets_array;
    }

    Local<Value> argv[] = {
        error,
        buckets_value
    };
    callback->Call(2, argv);
    free(req);
    free(work_req);
}

void GetBuckets(const Nan::FunctionCallbackInfo<Value>& args) {
    if (args.This()->InternalFieldCount() != 1) {
        return Nan::ThrowError("Environment not available for instance");
    }

    storj_env_t *env = (storj_env_t *)args.This()->GetAlignedPointerFromInternalField(0);
    if (!env) {
        return Nan::ThrowError("Environment is not initialized");
    }

    Nan::Callback *callback = new Nan::Callback(args[0].As<Function>());

    storj_bridge_get_buckets(env, (void *) callback, GetBucketsCallback);
}

void ListFilesCallback(uv_work_t *work_req, int status) {
    Nan::HandleScope scope;

    list_files_request_t *req = (list_files_request_t *) work_req->data;

    Nan::Callback *callback = (Nan::Callback*)req->handle;
    Local<Value> files_value = Nan::Null();
    Local<Value> error = Nan::Null();

    if (error_and_status_check<list_files_request_t>(req, &error)) {
        Local<Array> files_array = Nan::New<Array>();
        for (uint8_t i=0; i<req->total_files; i++) {
            Local<Object> file = Nan::New<Object>();
            file->Set(Nan::New("filename").ToLocalChecked(), Nan::New(req->files[i].filename).ToLocalChecked());
            file->Set(Nan::New("mimetype").ToLocalChecked(), Nan::New(req->files[i].mimetype).ToLocalChecked());
            file->Set(Nan::New("id").ToLocalChecked(), Nan::New(req->files[i].id).ToLocalChecked());
            files_array->Set(i, file);
        }
        files_value = files_array;
    }

    Local<Value> argv[] = {
        error,
        files_value
    };
    callback->Call(2, argv);
    free(req);
    free(work_req);
}

void ListFiles(const Nan::FunctionCallbackInfo<Value>& args) {
    if (args.This()->InternalFieldCount() != 1) {
        return Nan::ThrowError("Environment not available for instance");
    }

    storj_env_t *env = (storj_env_t *)args.This()->GetAlignedPointerFromInternalField(0);
    if (!env) {
        return Nan::ThrowError("Environment is not initialized");
    }

    String::Utf8Value str(args[0]);
    const char *bucket_id = *str;
    const char *bucket_id_dup = strdup(bucket_id);

    Nan::Callback *callback = new Nan::Callback(args[1].As<Function>());

    storj_bridge_list_files(env, bucket_id_dup, (void *) callback, ListFilesCallback);
}

void CreateBucketCallback(uv_work_t *work_req, int status) {
    Nan::HandleScope scope;

    create_bucket_request_t *req = (create_bucket_request_t *) work_req->data;

    Nan::Callback *callback = (Nan::Callback*)req->handle;

    Local<Value> bucket_value = Nan::Null();
    Local<Value> error = Nan::Null();

    if (error_and_status_check<create_bucket_request_t>(req, &error)) {
        Local<Object> bucket_object = Nan::To<Object>(Nan::New<Object>()).ToLocalChecked();
        bucket_object->Set(Nan::New("name").ToLocalChecked(), Nan::New(req->bucket->name).ToLocalChecked());
        bucket_object->Set(Nan::New("id").ToLocalChecked(), Nan::New(req->bucket->id).ToLocalChecked());
        bucket_object->Set(Nan::New("decrypted").ToLocalChecked(), Nan::New<Boolean>(req->bucket->decrypted));
        bucket_value = bucket_object;
    }

    Local<Value> argv[] = {
        error,
        bucket_value
    };
    callback->Call(2, argv);
    free(req);
    free(work_req);
}

void CreateBucket(const Nan::FunctionCallbackInfo<Value>& args) {
    if (args.This()->InternalFieldCount() != 1) {
        return Nan::ThrowError("Environment not available for instance");
    }

    storj_env_t *env = (storj_env_t *)args.This()->GetAlignedPointerFromInternalField(0);
    if (!env) {
        return Nan::ThrowError("Environment is not initialized");
    }

    String::Utf8Value str(args[0]);
    const char *name = *str;
    const char *name_dup = strdup(name);

    Nan::Callback *callback = new Nan::Callback(args[1].As<Function>());

    storj_bridge_create_bucket(env, name_dup, (void *) callback, CreateBucketCallback);
}

void DeleteBucketCallback(uv_work_t *work_req, int status) {
    Nan::HandleScope scope;

    json_request_t *req = (json_request_t *) work_req->data;

    Nan::Callback *callback = (Nan::Callback*)req->handle;
    Local<Value> error = Nan::Null();

    error_and_status_check<json_request_t>(req, &error);

    Local<Value> argv[] = {
        error
    };
    callback->Call(1, argv);
    free(req);
    free(work_req);
}

void DeleteBucket(const Nan::FunctionCallbackInfo<Value>& args) {
    if (args.This()->InternalFieldCount() != 1) {
        return Nan::ThrowError("Environment not available for instance");
    }

    storj_env_t *env = (storj_env_t *)args.This()->GetAlignedPointerFromInternalField(0);
    if (!env) {
        return Nan::ThrowError("Environment is not initialized");
    }

    String::Utf8Value str(args[0]);
    const char *id = *str;
    const char *id_dup = strdup(id);

    Nan::Callback *callback = new Nan::Callback(args[1].As<Function>());

    storj_bridge_delete_bucket(env, id_dup, (void *) callback, DeleteBucketCallback);
}

void StoreFileFinishedCallback(int status, char *file_id, void *handle) {
    Nan::HandleScope scope;

    transfer_callbacks_t *upload_callbacks = (transfer_callbacks_t *) handle;
    Nan::Callback *callback = upload_callbacks->finished_callback;

    Local<Value> file_id_local = Nan::Null();
    if (status == 0) {
        file_id_local = Nan::New(file_id).ToLocalChecked();
    }

    Local<Value> error = IntToStorjError(status);

    Local<Value> argv[] = {
        error,
        file_id_local
    };

    callback->Call(2, argv);
    if (file_id) {
        free(file_id);
    }
}

void StoreFileProgressCallback(double progress, uint64_t downloaded_bytes, uint64_t total_bytes, void *handle) {
    Nan::HandleScope scope;

    transfer_callbacks_t *upload_callbacks = (transfer_callbacks_t *) handle;
    Nan::Callback *callback = upload_callbacks->progress_callback;

    Local<Number> progress_local = Nan::New(progress);
    Local<Number> downloaded_bytes_local = Nan::New((double)downloaded_bytes);
    Local<Number> total_bytes_local = Nan::New((double)total_bytes);

    Local<Value> argv[] = {
        progress_local,
        downloaded_bytes_local,
        total_bytes_local
    };

    callback->Call(3, argv);
}

template<class StateType>
void StateStatusErrorGetter(Local<String> property, const Nan::PropertyCallbackInfo <Value> &info) {
    Local<Object> self = info.Holder();
    StateType *state = (StateType *) self->GetAlignedPointerFromInternalField(0);
    Local<Value> error = IntToStorjError(state->error_status);
    info.GetReturnValue().Set(error);
}

void StoreFile(const Nan::FunctionCallbackInfo<Value>& args) {
    if (args.This()->InternalFieldCount() != 1) {
        return Nan::ThrowError("Environment not available for instance");
    }

    storj_env_t *env = (storj_env_t *)args.This()->GetAlignedPointerFromInternalField(0);
    if (!env) {
        return Nan::ThrowError("Environment is not initialized");
    }

    String::Utf8Value bucket_id_str(args[0]);
    const char *bucket_id = *bucket_id_str;
    const char *bucket_id_dup = strdup(bucket_id);

    String::Utf8Value file_path_str(args[1]);
    const char *file_path = *file_path_str;

    v8::Local<v8::Object> options = args[2].As<v8::Object>();

    transfer_callbacks_t *upload_callbacks = static_cast<transfer_callbacks_t*>(malloc(sizeof(transfer_callbacks_t)));

    upload_callbacks->progress_callback = new Nan::Callback(options->Get(Nan::New("progressCallback").ToLocalChecked()).As<Function>());
    upload_callbacks->finished_callback = new Nan::Callback(options->Get(Nan::New("finishedCallback").ToLocalChecked()).As<Function>());

    String::Utf8Value file_name_str(options->Get(Nan::New("filename").ToLocalChecked()).As<v8::String>());
    const char *file_name = *file_name_str;
    const char *file_name_dup = strdup(file_name);

    String::Utf8Value index_str(options->Get(Nan::New("index").ToLocalChecked()).As<v8::String>());
    const char *index = *index_str;
    const char *index_dup = strdup(index);

    FILE *fd = fopen(file_path, "r");
    if (!fd) {
        v8::Local<v8::String> msg = Nan::New("Unable to open file").ToLocalChecked();
        v8::Local<v8::Value> error = Nan::Error(msg);

        Local<Value> argv[] = {
            error,
            Nan::Null()
        };

        upload_callbacks->finished_callback->Call(2, argv);
        return;
    }

    storj_upload_opts_t upload_opts = {};
    upload_opts.prepare_frame_limit =  1,
    upload_opts.push_frame_limit =  64;
    upload_opts.push_shard_limit =  64;
    upload_opts.rs =  true;
    upload_opts.bucket_id = bucket_id_dup;
    if (strlen(index_dup) == 64) {
        upload_opts.index = index_dup;
    } else {
        upload_opts.index = NULL;
    }
    upload_opts.file_name = file_name_dup;
    upload_opts.fd = fd;

    storj_upload_state_t *state = static_cast<storj_upload_state_t*>(malloc(sizeof(storj_upload_state_t)));
    // TODO handle error

    int status = storj_bridge_store_file(env,
        state,
        &upload_opts,
        (void *) upload_callbacks,
        StoreFileProgressCallback,
        StoreFileFinishedCallback);

    if (status) {
        // TODO give back an error
    }

    Isolate* isolate = args.GetIsolate();
    Local<ObjectTemplate> state_template = ObjectTemplate::New(isolate);
    state_template->SetInternalFieldCount(1);

    Local<Object> state_local = state_template->NewInstance();
    state_local->SetAlignedPointerInInternalField(0, state);
    Nan::SetAccessor(state_local, Nan::New("error_status").ToLocalChecked(),
                     StateStatusErrorGetter<storj_upload_state_t>);

    args.GetReturnValue().Set(state_local);
}

void StoreFileCancel(const Nan::FunctionCallbackInfo<Value>& args) {
    Local<Object> state_local = Nan::To<Object>(args[0]).ToLocalChecked();
    storj_upload_state_t *state = (storj_upload_state_t *)state_local->GetAlignedPointerFromInternalField(0);

    storj_bridge_store_file_cancel(state);
}

void ResolveFileCancel(const Nan::FunctionCallbackInfo<Value>& args) {
    Local<Object> state_local = Nan::To<Object>(args[0]).ToLocalChecked();
    storj_download_state_t *state = (storj_download_state_t *)state_local->GetAlignedPointerFromInternalField(0);

    storj_bridge_resolve_file_cancel(state);
}

void ResolveFileFinishedCallback(int status, FILE *fd, void *handle) {
    Nan::HandleScope scope;

    fclose(fd);

    transfer_callbacks_t *download_callbacks = (transfer_callbacks_t *) handle;
    Nan::Callback *callback = download_callbacks->finished_callback;

    Local<Value> error = IntToStorjError(status);

    Local<Value> argv[] = {
        error
    };

    callback->Call(1, argv);
}

void ResolveFileProgressCallback(double progress,
        uint64_t downloaded_bytes,
        uint64_t total_bytes,
        void *handle) {
    Nan::HandleScope scope;

    transfer_callbacks_t *download_callbacks = (transfer_callbacks_t *) handle;
    Nan::Callback *callback = download_callbacks->progress_callback;

    Local<Number> progress_local = Nan::New(progress);
    Local<Number> downloaded_bytes_local = Nan::New((double)downloaded_bytes);
    Local<Number> total_bytes_local = Nan::New((double)total_bytes);

    Local<Value> argv[] = {
        progress_local,
        downloaded_bytes_local,
        total_bytes_local
    };

    callback->Call(3, argv);
}

void ResolveFile(const Nan::FunctionCallbackInfo<Value>& args) {
    if (args.This()->InternalFieldCount() != 1) {
        return Nan::ThrowError("Environment not available for instance");
    }

    storj_env_t *env = (storj_env_t *)args.This()->GetAlignedPointerFromInternalField(0);
    if (!env) {
        return Nan::ThrowError("Environment is not initialized");
    }

    String::Utf8Value bucket_id_str(args[0]);
    const char *bucket_id = *bucket_id_str;
    const char *bucket_id_dup = strdup(bucket_id);

    String::Utf8Value file_id_str(args[1]);
    const char *file_id = *file_id_str;
    const char *file_id_dup = strdup(file_id);

    String::Utf8Value file_path_str(args[2]);
    const char *file_path = *file_path_str;


    v8::Local<v8::Object> options = args[3].As<v8::Object>();

    transfer_callbacks_t *download_callbacks = static_cast<transfer_callbacks_t*>(malloc(sizeof(transfer_callbacks_t)));

    download_callbacks->progress_callback = new Nan::Callback(options->Get(Nan::New("progressCallback").ToLocalChecked()).As<Function>());
    download_callbacks->finished_callback = new Nan::Callback(options->Get(Nan::New("finishedCallback").ToLocalChecked()).As<Function>());

    FILE *fd = NULL;

    if (file_path) {
        if(access(file_path, F_OK) != -1 ) {
            // TODO give error in callback that file exists
            printf("Warning: File already exists at path [%s].\n", file_path);

            // TODO have this be an option
            bool overwrite = false;
            if (overwrite) {
                unlink(file_path);
            } else {
                printf("\nCanceled overwriting of [%s].\n", file_path);
                return;
            }

        }

        fd = fopen(file_path, "w+");
    } else {
        fd = stdout;
    }

    if (fd == NULL) {
        // TODO give error in callback
        printf("Unable to open %s: %s\n", file_path, strerror(errno));
        return;
    }

    storj_download_state_t *state = static_cast<storj_download_state_t*>( malloc(sizeof(storj_download_state_t)));
    // TODO handle error

    int status = storj_bridge_resolve_file(env,
        state,
        bucket_id_dup,
        file_id_dup,
        fd,
        (void *) download_callbacks,
        ResolveFileProgressCallback,
        ResolveFileFinishedCallback);

    if (status) {
        // TODO give back an error
    }

    Isolate* isolate = args.GetIsolate();
    Local<ObjectTemplate> state_template = ObjectTemplate::New(isolate);
    state_template->SetInternalFieldCount(1);

    Local<Object> state_local = state_template->NewInstance();
    state_local->SetAlignedPointerInInternalField(0, state);
    Nan::SetAccessor(state_local, Nan::New("error_status").ToLocalChecked(),
                     StateStatusErrorGetter<storj_download_state_t>);

    args.GetReturnValue().Set(state_local);

}

// TODO: this is the same as DeleteBucketCallback; refactor
void DeleteFileCallback(uv_work_t *work_req, int status) {
    Nan::HandleScope scope;

    json_request_t *req = (json_request_t *) work_req->data;

    Nan::Callback *callback = (Nan::Callback*)req->handle;
    Local<Value> error = Nan::Null();

    error_and_status_check<json_request_t>(req, &error);

    Local<Value> argv[] = {
        error
    };
    callback->Call(1, argv);
    free(req);
    free(work_req);
}

void DeleteFile(const Nan::FunctionCallbackInfo<Value>& args) {
    if (args.This()->InternalFieldCount() != 1) {
        return Nan::ThrowError("Environment not available for instance");
    }

    storj_env_t *env = (storj_env_t *)args.This()->GetAlignedPointerFromInternalField(0);
    if (!env) {
        return Nan::ThrowError("Environment is not initialized");
    }

    String::Utf8Value bucket_id_str(args[0]);
    const char *bucket_id = *bucket_id_str;
    const char *bucket_id_dup = strdup(bucket_id);

    String::Utf8Value file_id_str(args[1]);
    const char *file_id = *file_id_str;
    const char *file_id_dup = strdup(file_id);

    Nan::Callback *callback = new Nan::Callback(args[2].As<Function>());

    storj_bridge_delete_file(env, bucket_id_dup, file_id_dup, (void *) callback, DeleteFileCallback);
}

void DestroyEnvironment(const Nan::FunctionCallbackInfo<Value>& args) {
    if (args.This()->InternalFieldCount() != 1) {
        return Nan::ThrowError("Environment not available for instance");
    }

    storj_env_t *env = (storj_env_t *)args.This()->GetAlignedPointerFromInternalField(0);
    if (!env) {
        return Nan::ThrowError("Environment is not initialized");
    }

    if (storj_destroy_env(env)) {
        Nan::ThrowError("Unable to destroy environment");
    }
}

void FreeEnvironmentCallback(const Nan::WeakCallbackInfo<storj_env_t> &data) {
    storj_env_t *env = data.GetParameter();
    if (env && storj_destroy_env(env)) {
        Nan::ThrowError("Unable to destroy environment");
    }
}

void Environment(const v8::FunctionCallbackInfo<Value>& args) {
    Nan::EscapableHandleScope scope;
    if (args.Length() == 0) {
        return Nan::ThrowError("First argument is expected");
    }

    v8::Local<v8::Object> options = args[0].As<v8::Object>();

    v8::Local<v8::String> bridgeUrl = options->Get(Nan::New("bridgeUrl").ToLocalChecked()).As<v8::String>();
    v8::Local<v8::String> bridgeUser = options->Get(Nan::New("bridgeUser").ToLocalChecked()).As<v8::String>();
    v8::Local<v8::String> bridgePass = options->Get(Nan::New("bridgePass").ToLocalChecked()).As<v8::String>();
    v8::Local<v8::String> encryptionKey = options->Get(Nan::New("encryptionKey").ToLocalChecked()).As<v8::String>();
    Nan::MaybeLocal<Value> user_agent = options->Get(Nan::New("userAgent").ToLocalChecked());
    Nan::MaybeLocal<Value> logLevel = options->Get(Nan::New("logLevel").ToLocalChecked());

    v8::Local<v8::FunctionTemplate> constructor = Nan::New<v8::FunctionTemplate>();
    constructor->SetClassName(Nan::New("Environment").ToLocalChecked());
    constructor->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::SetPrototypeMethod(constructor, "getInfo", GetInfo);
    Nan::SetPrototypeMethod(constructor, "getBuckets", GetBuckets);
    Nan::SetPrototypeMethod(constructor, "createBucket", CreateBucket);
    Nan::SetPrototypeMethod(constructor, "deleteBucket", DeleteBucket);
    Nan::SetPrototypeMethod(constructor, "listFiles", ListFiles);
    Nan::SetPrototypeMethod(constructor, "storeFile", StoreFile);
    Nan::SetPrototypeMethod(constructor, "storeFileCancel", StoreFileCancel);
    Nan::SetPrototypeMethod(constructor, "resolveFile", ResolveFile);
    Nan::SetPrototypeMethod(constructor, "resolveFileCancel", ResolveFileCancel);
    Nan::SetPrototypeMethod(constructor, "deleteFile", DeleteFile);
    Nan::SetPrototypeMethod(constructor, "destroy", DestroyEnvironment);

    Nan::MaybeLocal<v8::Object> maybeInstance;
    v8::Local<v8::Object> instance;

    v8::Local<v8::Value> argv[] = {};
    maybeInstance = Nan::NewInstance(constructor->GetFunction(), 0, argv);

    if (maybeInstance.IsEmpty()) {
        return Nan::ThrowError("Could not create new Storj instance");
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
    if (!user_agent.IsEmpty()) {
        String::Utf8Value str(user_agent.ToLocalChecked());
        http_options.user_agent = strdup(*str);
    } else {
        http_options.user_agent = "storj-test";
    }
    http_options.low_speed_limit = STORJ_LOW_SPEED_LIMIT;
    http_options.low_speed_time = STORJ_LOW_SPEED_TIME;
    http_options.timeout = STORJ_HTTP_TIMEOUT;
    http_options.cainfo_path = NULL;

    static storj_log_options_t log_options = {};
    log_options.logger = JsonLogger;
    log_options.level = 0;
    if (!logLevel.IsEmpty()) {
        log_options.level = To<int>(logLevel.ToLocalChecked()).FromJust();
    }

    // Initialize environment

    storj_env_t *env = storj_init_env(&bridge_options,
                                      &encrypt_options,
                                      &http_options,
                                      &log_options);

    if (!env) {
        Nan::ThrowError("Environment is not initialized");
    }

    // Make sure that the loop is the default loop
    env->loop = uv_default_loop();

    // Pass along the environment so it can be accessed by methods
    instance->SetAlignedPointerInInternalField(0, env);

    Nan::Persistent<v8::Object> persistent(instance);

    // There is no guarantee that the free callback will be called
    persistent.SetWeak(env, FreeEnvironmentCallback, WeakCallbackType::kParameter);
    persistent.MarkIndependent();
    Nan::AdjustExternalMemory(sizeof(storj_env_t));

    args.GetReturnValue().Set(persistent);
}

void init(Handle<Object> exports) {
    NODE_SET_METHOD(exports, "Environment", Environment);
    NODE_SET_METHOD(exports, "utilTimestamp", Timestamp);
    NODE_SET_METHOD(exports, "mnemonicCheck", MnemonicCheck);
    NODE_SET_METHOD(exports, "mnemonicGenerate", MnemonicGenerate);
}

NODE_MODULE(storj, init);

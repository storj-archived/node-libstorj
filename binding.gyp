{
  'targets': [{
    'target_name': 'libstorj',
    'include_dirs' : [
      '<!(node -e "require(\'nan\')")',
      '/home/bgf/storj/libstorj-c/release/x86_64-pc-linux-gnu/include'
    ],
    'libraries': [
      '/home/bgf/storj/libstorj-c/release/x86_64-pc-linux-gnu/lib/libstorj.a',
    ],
    'sources': [
      'libstorj.cc',
    ],
    'conditions': [
        ['OS=="mac"', {
          'xcode_settings': {
            'MACOSX_DEPLOYMENT_TARGET': '10.9'
          }
        }
      ]
    ],
    'cflags_cc': [
    ],
    'link_settings': {
      'libraries': [
      ],
      'ldflags': [
        '-Wl,--whole-archive /home/bgf/storj/libstorj-c/depends/build/x86_64-pc-linux-gnu/lib/libnettle.a -Wl,--whole-archive /home/bgf/storj/libstorj-c/depends/build/x86_64-pc-linux-gnu/lib/libgnutls.a -Wl,--whole-archive /home/bgf/storj/libstorj-c/depends/build/x86_64-pc-linux-gnu/lib/libhogweed.a -Wl,--whole-archive /home/bgf/storj/libstorj-c/depends/build/x86_64-pc-linux-gnu/lib/libjson-c.a -Wl,--whole-archive /home/bgf/storj/libstorj-c/depends/build/x86_64-pc-linux-gnu/lib/libgmp.a -Wl,--whole-archive /home/bgf/storj/libstorj-c/depends/build/x86_64-pc-linux-gnu/lib/libcurl.a -Wl,--no-whole-archive'
      ]
    }
  }]
}

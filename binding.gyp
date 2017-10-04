{
  'targets': [{
    'target_name': 'libstorj',
    'include_dirs' : [
      '<!(node -e "require(\'nan\')")',
      '<!(node ./binding.js include_dirs)',
      '<!(node ./binding.js include_dirs_deps)'
    ],
    'libraries': [
      '<!(node ./binding.js libraries)'
    ],
    'sources': [
      'binding.cc',
    ],
    'conditions': [
        ['OS=="mac"', {
          'xcode_settings': {
            'MACOSX_DEPLOYMENT_TARGET': '10.9',
            'OTHER_LDFLAGS': [
              '<!(node ./binding.js ldflags_mac)'
            ],
            'CLANG_CXX_LIBRARY': 'libc++',
            'CLANG_CXX_LANGUAGE_STANDARD':'c++11'
          }
        }
      ]
    ],
    'cflags_cc': [
    ],
    'link_settings': {
      'ldflags': [
        '<!(node ./binding.js ldflags)'
      ]
    }
  }]
}

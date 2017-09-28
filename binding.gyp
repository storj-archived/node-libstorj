{
  'targets': [{
    'target_name': 'libstorj',
    'include_dirs' : [
      '<!(node -e "require(\'nan\')")',
      '<!(node ./binding.js include_dirs)'
    ],
    'libraries': [
      '<!(node ./binding.js libraries)'
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
      'ldflags': [
        '<!(node ./binding.js ldflags)'
      ]
    }
  }]
}

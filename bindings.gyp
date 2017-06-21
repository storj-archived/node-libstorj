{
  'targets': [{
    'target_name': 'node-libstorj',
    'include_dirs' : [
      '<!(node -e "require(\'nan\')")'
    ],
    'sources': [
      './src/libstorj.cc',
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
      ]
    }
  }]
}

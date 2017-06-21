{
  'targets': [{
    'target_name': 'libstorj',
    'include_dirs' : [
      '<!(node -e "require(\'nan\')")',
      'storj.h',
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
        '-lstorj'
      ],
      'ldflags': [
      ]
    }
  }]
}

{
  'targets': [{
    'target_name': 'libstorj',
    'include_dirs' : [
      '<!(node -e "require(\'nan\')")',
      'libstorj-1.0.0/include',      
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

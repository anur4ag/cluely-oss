{
  "targets": [
    {
      "target_name": "screen_privacy",
      "sources": [
        "screen_privacy.mm"
      ],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.12"
          },
          "link_settings": {
            "libraries": [
              "-framework Cocoa",
              "-framework ApplicationServices"
            ]
          }
        }]
      ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
} 
if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/amolaksingh/.gradle/caches/8.14.3/transforms/e8989d61f4b78ccb6eae212c9ac00ff1/transformed/hermes-android-0.81.5-release/prefab/modules/libhermes/libs/android.x86/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/amolaksingh/.gradle/caches/8.14.3/transforms/e8989d61f4b78ccb6eae212c9ac00ff1/transformed/hermes-android-0.81.5-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()


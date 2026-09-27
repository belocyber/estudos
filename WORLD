"use client";
import { Globe3D, GlobeMarker } from "@/components/ui/3d-globe";

const sampleMarkers: GlobeMarker[] = [
  {
    lat: 40.7128,
    lng: -74.006,
    src: "https://cdn.21st.dev/assets/localized/9330b299938127244aa249ee03c095db066c29c3545aebcc61662ed5499003e9.webp",
    label: "New York",
  },
  {
    lat: 51.5074,
    lng: -0.1278,
    src: "https://cdn.21st.dev/assets/localized/39f1e89e5596050671d2c5e43247556682b6501fdc26a72514c1b6b27aca1040.webp",
    label: "London",
  },
  {
    lat: 35.6762,
    lng: 139.6503,
    src: "https://cdn.21st.dev/assets/localized/d2f606dd20ae0f042b33801d94e64ebede24d0881c18518f027e75871c46db24.webp",
    label: "Tokyo",
  },
  {
    lat: -33.8688,
    lng: 151.2093,
    src: "https://cdn.21st.dev/assets/localized/db3a4fbabb256c7ddb62896ba874be07f89dcce5ec82dbf31f0d29241a089c0d.webp",
    label: "Sydney",
  },
  {
    lat: 48.8566,
    lng: 2.3522,
    src: "https://cdn.21st.dev/assets/localized/517863093d43d51285cbb156a97a13dbb8a4da2178336e63fb84a2f9dff31721.webp",
    label: "Paris",
  },
  {
    lat: 28.6139,
    lng: 77.209,
    src: "https://cdn.21st.dev/assets/localized/a6b7394b90e0f93c7a07e26b63fc927bb6b4c361474f508b3902196d30ec29d9.webp",
    label: "New Delhi",
  },
  {
    lat: 55.7558,
    lng: 37.6173,
    src: "https://cdn.21st.dev/assets/localized/ddf108b39535f3be69c96dae3c31c69ed9ba282766c8543c5ff78dd4edc7755e.webp",
    label: "Moscow",
  },
  {
    lat: -22.9068,
    lng: -43.1729,
    src: "https://cdn.21st.dev/assets/localized/ee638b072758424ef4dc58adbf6d24d95d562f371b5d5660e3cf4682507f9b21.webp",
    label: "Rio de Janeiro",
  },
  {
    lat: 31.2304,
    lng: 121.4737,
    src: "https://cdn.21st.dev/assets/localized/d74859654f1bfc3e0258b9b7e519319287c3f6e4c0c8cebfd42dec18c33f747c.webp",
    label: "Shanghai",
  },
  {
    lat: 25.2048,
    lng: 55.2708,
    src: "https://cdn.21st.dev/assets/localized/8e5396313325182ff85d1229a80fdff6351d6e9d18a74ba7a202cefdba9eb840.webp",
    label: "Dubai",
  },
  {
    lat: -34.6037,
    lng: -58.3816,
    src: "https://cdn.21st.dev/assets/localized/4270ec0a3fab31d664d1febae5f74fb06603099fa8476feb7367dec5f04ecb57.webp",
    label: "Buenos Aires",
  },
  {
    lat: 1.3521,
    lng: 103.8198,
    src: "https://cdn.21st.dev/assets/localized/276d61dd498c0836991acd0d78c3e588dfe2396ac209eadd76f7e610588d473e.webp",
    label: "Singapore",
  },
  {
    lat: 37.5665,
    lng: 126.978,
    src: "https://cdn.21st.dev/assets/localized/4134f3dcc459b74f84d65c239bccbf6532920d950a1ee11e3c2a738f9d455be5.webp",
    label: "Seoul",
  },
];

export default function Globe3DDemo() {
  return (
    <div className="h-screen w-full">
      <Globe3D
        className="h-full w-full"
        markers={sampleMarkers}
        config={{
          atmosphereColor: "#4da6ff",
          atmosphereIntensity: 20,
          bumpScale: 5,
          autoRotateSpeed: 0.3,
        }}
        onMarkerClick={(marker) => {
          console.log("Clicked marker:", marker.label);
        }}
        onMarkerHover={(marker) => {
          if (marker) {
            console.log("Hovering:", marker.label);
          }
        }}
      />
    </div>
  );
}

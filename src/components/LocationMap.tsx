// Carte Leaflet (OpenStreetMap) affichée dans une WebView.
// React Native n'a pas de rendu DOM natif : Leaflet étant une lib web, on l'embarque via une
// mini page HTML chargée dans une WebView. Le marqueur est déplaçable (tap ou drag), et toute
// nouvelle position est renvoyée à l'app via `window.ReactNativeWebView.postMessage`.
import { useMemo, useRef } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import WebView from "react-native-webview";
import { colors, radius } from "../theme/colors";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  /** Appelé quand l'utilisateur tape sur la carte ou déplace le marqueur. */
  onLocationChange: (latitude: number, longitude: number) => void;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

function buildHtml(latitude: number, longitude: number): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; background: ${colors.surface2}; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map = L.map('map', { attributionControl: false, zoomControl: true }).setView([${latitude}, ${longitude}], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      var marker = L.marker([${latitude}, ${longitude}], { draggable: true }).addTo(map);

      function sendPosition(latlng) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: latlng.lat, longitude: latlng.lng }));
      }

      marker.on('dragend', function (e) {
        sendPosition(e.target.getLatLng());
      });

      map.on('click', function (e) {
        marker.setLatLng(e.latlng);
        sendPosition(e.latlng);
      });
    </script>
  </body>
</html>`;
}

export default function LocationMap({ latitude, longitude, onLocationChange, height = 200, style }: LocationMapProps) {
  // On ne régénère le HTML (et donc on ne recharge la carte) que si la position change de façon
  // significative, pour éviter de rafraîchir la WebView à chaque frame de GPS.
  const roundedKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const html = useMemo(() => buildHtml(latitude, longitude), [roundedKey]);
  const webviewRef = useRef<WebView>(null);

  return (
    <View style={[styles.wrapper, { height }, style]}>
      <WebView
        ref={webviewRef}
        key={roundedKey}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.webview}
        onMessage={(event) => {
          try {
            const { latitude: lat, longitude: lng } = JSON.parse(event.nativeEvent.data);
            if (typeof lat === "number" && typeof lng === "number") onLocationChange(lat, lng);
          } catch {
            // message inattendu, on l'ignore
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
  },
  webview: { flex: 1, backgroundColor: "transparent" },
});

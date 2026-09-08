# Civic Report - App Android (React Native + TypeScript + Redux Toolkit + Supabase)

Portage de la maquette web MVP en application Android native, avec :
- React Native / Expo (SDK 54) pour l'UI (buildable et ouvrable dans Android Studio)
- TypeScript partout (.ts / .tsx), mode strict active, `npx tsc --noEmit` sans erreur
- Redux Toolkit pour la gestion d'etat globale (auth, rapports, notifications)
- Supabase comme backend (Auth, Postgres, Storage) a la place du localStorage
- Une architecture en composants reutilisables typés (Header, BottomNav, Screen, Button, CategoryCard, ReportCard, MediaThumb, StatCard, FormField)

## 1. Structure du projet

```
civic-report-rn/
  App.tsx                     - Provider Redux + providers Expo + navigation
  app.json                    - config Expo / Android (package, permissions...)
  tsconfig.json                - extends expo/tsconfig.base, strict: true
  src/
    types/
      index.ts                - types metier partages (Category, Report, ReportDraft,
                                 RootStackParamList, ScreenProps<T>, IoniconName...)
      declarations.d.ts       - types pour react-native-keyboard-aware-scroll-view
    components/
      Header.tsx              - topbar
      BottomNav.tsx           - footer / navigation
      Screen.tsx              - layout commun Header + contenu + BottomNav
      Button.tsx
      FormField.tsx
      CategoryCard.tsx
      ReportCard.tsx
      MediaThumb.tsx
      StatCard.tsx
    store/
      store.ts                - configureStore + export RootState / AppDispatch
      hooks.ts                - useAppDispatch / useAppSelector typés + useToast()
      authSlice.ts            - session Supabase, profil, thunks signIn/signUp/signOut
      reportsSlice.ts         - liste des rapports, draft du formulaire, upload photos
      toastSlice.ts           - notifications transitoires
      AuthListener.tsx        - synchronise supabase.auth.onAuthStateChange -> store
      ToastHost.tsx           - affichage du toast, lu depuis le store
    screens/
      LoginScreen.tsx
      CategoriesScreen.tsx
      MediaChoiceScreen.tsx
      ReportFormScreen.tsx
      HistoryScreen.tsx
      ProfileScreen.tsx
    navigation/RootNavigator.tsx
    constants/categories.ts   - categories & types (miroir de report_categories/types)
    lib/supabase.ts           - client Supabase
    theme/colors.ts           - tokens repris de styles.css (as const)
  supabase/schema.sql          - schema SQL complet + RLS + seed
```

## 2. TypeScript

- `tsconfig.json` etend `expo/tsconfig.base` avec `strict: true`.
- Tous les types metier vivent dans `src/types/index.ts` :
  - `Category`, `ReportType` : referentiel des categories de signalement
  - `Report`, `ReportRow` : rapport formate pour l'UI vs. ligne brute Supabase
  - `ReportDraft` : etat du formulaire en cours de redaction
  - `RootStackParamList` : table de routage React Navigation
  - `ScreenProps<"NomEcran">` : raccourci pour typer les props recues par un ecran
  - `AppNavigation` : sous-ensemble (navigate, goBack) utilise par le composant Screen
    pour rester agnostique de l'ecran appelant, sans les soucis de variance TypeScript
    lies a NativeStackNavigationProp<ParamList, "EcranPrecis">
  - `IoniconName` : union des noms d'icones Ionicons valides (@expo/vector-icons)
- Verifier les types sans compiler :
  ```bash
  npx tsc --noEmit
  ```

## 3. Gestion d'etat avec Redux Toolkit

Trois slices composent le store (src/store/store.ts), avec RootState/AppDispatch exportes
et utilises par les hooks types useAppSelector/useAppDispatch (src/store/hooks.ts) :

| Slice | Role | Thunks / actions principaux |
|---|---|---|
| auth | session Supabase, profil, statut de connexion | bootstrapSession, signIn, signUp, signOut, sessionChanged |
| reports | liste des rapports + brouillon du formulaire en cours | fetchReports, submitReport, updateDraft, resetDraft |
| toast | notification transitoire affichee en bas d'ecran | showToast, hideToast |

AuthListener (monte une fois dans App.tsx, sans rendu visuel) s'abonne a
supabase.auth.onAuthStateChange et dispatch sessionChanged a chaque changement -
le store reste donc toujours synchronise avec Supabase, y compris apres un refresh
de token en arriere-plan.

Dans les ecrans, on utilise les hooks types (jamais useDispatch/useSelector bruts) :
```ts
const dispatch = useAppDispatch();
const reports = useAppSelector(selectReports);
await dispatch(submitReport()).unwrap(); // .unwrap() relance l'erreur si le thunk est rejete
```

## 4. Configurer Supabase

1. Creez un projet sur supabase.com.
2. Dans SQL Editor, executez le contenu de `supabase/schema.sql`. Il cree :
   - `profiles` (relie a auth.users, cree automatiquement a l'inscription via un trigger)
   - `report_categories` / `report_types` (referentiel, pre-rempli)
   - `reports`, `report_images`, `report_videos`
   - les policies RLS (chaque utilisateur ne voit/ecrit que ses propres rapports)
   - le bucket Storage `report-media` pour les photos
3. Dans Project Settings -> API, recuperez Project URL et anon public key.
4. Copiez `.env.example` vers `.env` et renseignez ces deux valeurs :
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```

Modele de donnees conserve du MLD d'origine : users(1)--<reports(1)--<media,
report_categories(1)--<report_types(1)--<reports. La table users est remplacee
par profiles qui etend auth.users (Supabase Auth gere deja l'email/mot de passe).
images et videos restent deux tables distinctes (report_images, report_videos).

## 5. Installer les dependances

```bash
npm install
```

## 6. Lancer en developpement (Expo Go, rapide a tester)

```bash
npx expo start
```
Scannez le QR code avec l'app Expo Go sur votre telephone Android (assurez-vous que
la version d'Expo Go installee correspond au SDK 54 - sinon mettez a jour l'app
Expo Go depuis le Play Store).

## 7. Ouvrir le projet natif dans Android Studio

Comme demande, voici comment obtenir un projet Android natif ouvrable dans Android Studio :

```bash
npx expo prebuild --platform android
```

Cette commande genere un dossier android/ contenant un projet Gradle standard.

Ensuite :
1. Ouvrez Android Studio.
2. File -> Open -> selectionnez le dossier civic-report-rn/android.
3. Laissez Gradle synchroniser (premiere fois : plusieurs minutes).
4. Choisissez un emulateur ou un appareil physique (debogage USB active) puis Run.

Pour relancer le bundler Metro en parallele pendant le developpement :
```bash
npx expo start --dev-client
```

Pour generer un APK/AAB de production :
```bash
cd android
./gradlew assembleRelease   # APK
./gradlew bundleRelease     # AAB (Play Store)
```

## 8. Fonctionnalites portees depuis le MVP web

| Ecran web (app.js) | Ecran RN (TSX) | Backend |
|---|---|---|
| renderLogin | LoginScreen.tsx | Supabase Auth (email/mot de passe) |
| renderCategories | CategoriesScreen.tsx | constants/categories.ts |
| renderMediaChoice | MediaChoiceScreen.tsx | expo-image-picker |
| renderReportForm | ReportFormScreen.tsx | reports + report_images (insert + upload Storage) |
| renderHistory | HistoryScreen.tsx | select * from reports where user_id = auth.uid() |
| renderProfile | ProfileScreen.tsx | profiles + agregats sur reports.status |

## 9. Pistes d'evolution

- Geolocalisation reelle (expo-location) au lieu de la position simulee.
- Capture video native (expo-camera + upload dans report_videos).
- Notifications push Supabase a l'acceptation/refus d'un rapport.
- Espace "administration" (web) pour changer reports.status et rejection_reason.

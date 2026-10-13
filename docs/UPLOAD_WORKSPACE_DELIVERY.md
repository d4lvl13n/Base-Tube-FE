# UP-UX — Livraison de l'espace unique d'envoi (web + SDK)

Date : 13 octobre 2026.
Spec : `docs/SPRINT_UPLOAD_UX.md` (dépôt principal, non suivie par Git au moment de la livraison).
Contrat backend : `base-be/docs/CREATOR_DRAFTS_API.md` (commit backend `8f4a2732`, fusionné localement, non déployé).
Référence UX : AmazingAerial ADR-0025 (`IntakeWorkspace`, `WorkspaceMetadataPanel`), lue sans modification.
Statut : implémenté localement sur la branche `feat/upload-workspace-ux`. Ni poussé, ni fusionné, ni déployé.
Aucun test lancé ni écrit (consigne de Damien). Vérification faite : typecheck SDK et web, ESLint sur les fichiers modifiés.

## 1. Ce qui change pour le créateur

- Un seul écran « Add videos » pour une ou plusieurs vidéos. L'envoi démarre dès le choix des fichiers.
- Écran vide : une grande zone de dépôt sur toute la hauteur, avec le choix de la chaîne de destination.
- Dès la première vidéo, l'écran a trois parties fixes, sans rien qui défile sous l'en-tête :
  - un en-tête (titre, chaîne de destination, « Add videos ») ;
  - une grille de vignettes au format vidéo, la seule partie qui défile ;
  - une barre d'actions en bas : le résumé (« 3 videos · 1 uploading · 1 ready to publish ») et les actions
    de groupe (« Hold next uploads », « Remove the N waiting videos »).
- Chaque vignette montre l'image de la vidéo, une pastille d'état du fichier (« Uploading 64% », « Preparing »…,
  ou une coche verte quand la lecture est disponible), le titre, la taille, et « Ready to publish » ou « Published ».
  Une croix permet de retirer la vidéo, après confirmation.
- Cliquer une vignette ouvre le panneau de détails de cette vidéo à droite : titre, description (grande zone,
  outil IA existant), miniature (Automatic / Upload / Create with AI), puis l'état de sauvegarde et « Publish ».
  Précédent / Suivant passent d'une vidéo à l'autre sans fermer le panneau.
- Le titre, la description et la miniature se remplissent pendant l'envoi. Ils sont sauvegardés tout seuls :
  800 ms après la dernière frappe, et quand on quitte le champ.
- Chaque vidéo est un brouillon privé. Elle n'est publiée que par le bouton « Publish » de cette vidéo.
- Il n'y a pas de condition d'activation : pas de flag frontend, pas de vérification `creatorDraftsV1`,
  pas de mode fantôme, aucune lecture de `/config/view-config` pour ce parcours.

### Selon la largeur d'écran

| Largeur | Panneau de détails |
|---|---|
| 1 200 px et plus | À droite de la grille, qui reste visible et cliquable |
| 768 à 1 199 px | Par-dessus la grille, sur le côté droit, avec un fond assombri ; cliquer le fond ferme le panneau |
| Moins de 768 px | Plein écran ; la fermeture revient à la vignette |

Ces largeurs sont décidées en JavaScript : la feuille de style de `@coinbase/onchainkit` annule les classes
Tailwind d'affichage responsive (`hidden md:block`).

## 2. Chemins d'entrée

| Adresse | Résultat |
|---|---|
| `/creator-hub/uploads` | Espace d'envoi, aucun brouillon ouvert |
| `/creator-hub/uploads/:draftId` | Espace d'envoi, brouillon exact ouvert (chargé depuis le serveur s'il n'est pas sur l'appareil) |
| `/creator-hub/upload` (ancien envoi individuel) | Même espace — les favoris restent valides |
| `/creator-hub/content-studio` (ancien envoi multiple) | Même espace — les favoris restent valides |
| Menu Creator Hub | Bouton principal et entrée de menu « Add videos » → `/creator-hub/uploads`. L'entrée « Studio », devenue un doublon, est retirée du menu ; son adresse fonctionne toujours. |
| Videos Management | Section « In preparation · private drafts » avec « Continue preparing », qui ouvre le brouillon exact |
| Panneau global (bas à droite) | Les lignes d'un brouillon affichent son titre et un lien « Open » vers ce brouillon |

L'adresse décide seule du brouillon ouvert. Cliquer une vignette, Précédent / Suivant ou fermer change l'adresse.
Le bouton Retour du navigateur et les liens depuis Videos Management ouvrent donc toujours le bon brouillon.
Une vidéo tout juste ajoutée n'a pas encore d'identifiant serveur : elle reste ouverte, puis reçoit son adresse
dès que le serveur répond. Si le créateur navigue ailleurs pendant qu'un brouillon se charge, ce chargement
n'ouvre plus rien en arrivant.

Les envois historiques (sans brouillon) restent dans la file globale. Ils sont aussi listés sous
« Earlier uploads » dans l'espace, avec leurs actions habituelles, jusqu'à leur résolution. Ils ne sont pas convertis.

## 3. Matrice des états couverts

### 3.1 État technique (fichier)

La pastille est le texte court sur la vignette. La phrase complète et l'action sont dans le panneau de détails.

| Situation | Pastille | Phrase complète | Action |
|---|---|---|---|
| Brouillon en cours de création | Setting up | Setting up your draft… | Cancel (si fichier) |
| Création refusée temporairement | Setting up | Setting up your draft — retrying when the connection allows. | Attendre |
| Création refusée | Not created | message traduit | Try again |
| En attente d'envoi | Waiting | Waiting to send | Cancel |
| Envoi | Uploading 64% | Sending video · 64% | Cancel |
| Réseau absent | Offline | Connection lost. Sending resumes automatically when it is back. | Attendre |
| Autre erreur passagère | Retrying | phrase traduite du code | Retry now |
| Session expirée | Sign in again | Sign in again to continue. Your progress is kept. | Sign in again |
| Fichier absent, même navigateur | Needs its file | Choose “nom” (taille) again. Only the parts not yet received are sent. | Choose file |
| Fichier absent, envoi commencé dans un autre navigateur | Needs its file | Choose “nom” (taille). It was started in another browser, so it is sent again in full. | Choose file |
| Envoi pris en charge par un autre onglet | Other tab | Sending in another BaseTube tab. | Attendre |
| Octets envoyés, confirmation serveur | Checking | Checking the file was received… | Attendre |
| Annulation demandée | Cancelling | Cancelling… | — |
| Annulation incertaine | Cancel unconfirmed | We couldn't confirm the cancellation. The file may still be sending. | Check again / Cancel |
| Envoi annulé | Cancelled | Sending cancelled. Your details are kept. | Send the file again |
| Démarrage non confirmé (`held`) | — | We couldn't confirm this upload started… | — |
| Transfert confirmé | Preparing | Video received. Preparing playback. | Continuer l'édition |
| Lecture prête | coche verte | Playback available · Private draft | Preview |
| Préparation échouée (`retry_processing`) | Preparation failed | Preparation failed. Your file is kept. | Retry preparation |
| Envoi expiré (`replace_file`, `UPLOAD_EXPIRED`) | Expired | This upload expired. Your details are kept. | Send the file again (nouvelle tentative, même brouillon) |
| `contact_support` | — | This video needs our help. Your details are kept. + référence | — |
| Brouillon sans fichier | — | No video file attached yet. | Choose file |

Un pourcentage n'apparaît que pendant l'envoi des octets. Aucun pourcentage ni temps restant n'est affiché pour la préparation.

Quand des vidéos attendent leur fichier (après un rechargement ou sur un autre appareil), un bandeau au-dessus
de la grille propose « Choose the N files » ou le dépôt. Les fichiers déposés sont associés aux bonnes vidéos.
Un fichier qui ne correspond à aucune est nommé à l'écran et n'est jamais ajouté sans le dire.

### 3.2 Sauvegarde

| Situation | Texte |
|---|---|
| Frappe en attente / requête en cours | Saving… |
| Confirmé par le serveur | Draft saved |
| Échec | Changes not saved — raison + Try again |
| Hors connexion, stockage local réussi | Changes kept on this device. They are saved when you are back online. |
| Hors connexion, stockage local impossible | You are offline and this browser cannot keep these changes. Leaving now would lose them. |
| Session expirée | Sign in again to save your changes… + Sign in again |
| Conflit de révision | Panneau « This draft was changed somewhere else » : version locale et version serveur côte à côte, puis « Load the saved version » ou « Keep my changes » |
| Champ invalide | Changes not saved: check the fields marked below. |
| Vidéo publiée | Video published — saved changes are visible to viewers. |

### 3.3 Publication

- Bouton désactivé tant qu'un blocage existe ; les raisons sont listées juste au-dessus.
  Blocages locaux : sauvegarde en cours ou échouée, conflit, titre invalide, miniature non enregistrée,
  session expirée. Blocages serveur : les cinq codes du contrat, chacun avec sa phrase ;
  un code inconnu reçoit une phrase générique et sa référence.
- Au clic : fin de l'autosave et attente de sa confirmation, puis révision figée.
  Un `clientOperationId` est enregistré sur l'appareil avant l'envoi.
- Réponse perdue : « Checking the publication… », puis renvoi du même identifiant (3 s, 10 s, 30 s), puis « Check again ».
  Après un rechargement, la commande en attente est rejouée avec le même identifiant.
- Succès : « Video published », View video, Copy link. L'espace ne redirige pas ailleurs.
- Retour en brouillon privé : action distincte dans « More options », avec confirmation.

### 3.4 Miniature

- Trois choix : Automatic, Upload (JPEG/PNG, 5 Mo), Create with AI (outil existant).
- L'image est gardée sur l'appareil, envoyée comme asset puis sélectionnée avec contrôle de révision.
  « saved » n'apparaît qu'après la sélection serveur.
- Le choix le plus récent gagne. Chaque choix reçoit son numéro dès le clic, avant toute attente.
  Une réponse lente pour un ancien choix n'est jamais sélectionnée. Un fichier refusé (mauvais format, trop lourd)
  n'annule pas le choix précédent encore en cours.
- Choisir une miniature ne touche qu'à la miniature : un titre tapé pendant l'enregistrement de l'image est conservé.
- « Load the saved version » (conflit) annule les choix de miniature faits avant le clic, pas ceux faits après.
- Si le navigateur ne peut pas garder l'image : un avertissement s'affiche, et après rechargement l'interface demande de la choisir à nouveau.
- Une image IA dans un autre format est convertie en JPEG dans le navigateur avant l'envoi.

### 3.5 Retirer une vidéo

- La croix d'une vignette supprime le brouillon et son envoi inachevé, après confirmation.
  Le serveur ferme l'envoi et libère sa place dans la file.
- « Remove the N waiting videos » retire d'un coup, après confirmation, les vidéos qui attendent leur fichier.
- Les envois que personne ne voit plus sont fermés sur le serveur et oubliés, pour ne pas occuper de place :
  un ancien envoi d'un brouillon qui en a un plus récent, ou un envoi dont le brouillon n'est plus sur l'appareil.
  Un envoi au résultat inconnu (`held`) n'est jamais touché.

## 4. SDK (`packages/api-sdk`)

- `drafts/` : types du contrat livré, routes `creator-drafts` (création, liste, lecture, PATCH, attachement
  d'un envoi, asset de miniature, sélection, publication, `retry-processing`, aperçu, suppression),
  validation stricte des réponses, règles pures d'autosave (`remainingAfterAck`, `diffAgainstServer`…)
  et calcul « prêt à publier ».
- `auth/` : un seul renouvellement de session partagé entre requêtes, puis attente explicite de reconnexion.
  Seul un 401 avec enveloppe JSON compte. Un 403 ou un 404 ne déclenche jamais de reconnexion.
- `upload/` (ajouts sans rien retirer) : état local `auth_required`, rattachement optionnel `creatorDraft`,
  `createDraftQueueEntry`, champs `resumeExpiresAt` et `resumeExpiresAtEstimated`.
- Client : `client.creatorDrafts`.

Le transfert multipart n'a pas changé : un envoi de brouillon est créé par `POST /creator-drafts/:id/uploads`,
puis suit le moteur V2 existant (4 fichiers actifs, 3 morceaux par fichier, morceaux confirmés jamais renvoyés).

## 5. Écarts et points ouverts avec le contrat

1. **Reprise depuis un autre navigateur.** La projection du brouillon ne contient pas la date du fichier.
   Le client ne peut donc pas prouver que le fichier choisi est le même. Il ne reprend jamais cet envoi :
   il le ferme (après confirmation du serveur), puis renvoie le fichier en entier comme nouvel envoi du même
   brouillon. Le titre, la description et la miniature sont gardés. Coût : le fichier repart de zéro.
   Une empreinte du contenu côté serveur permettrait de reprendre au lieu de recommencer.
2. **Conflit sur la suppression.** Le contrat ne nomme pas le code renvoyé quand la révision `If-Match` est périmée.
   Le client traite 409 et 412 de la même façon : il recharge le brouillon et demande de recommencer.
3. **Aperçu `thumbnail`.** Le client suppose que c'est la miniature actuellement retenue (affiche automatique ou personnalisée).
4. **Videos Management.** L'API de liste des vidéos n'expose pas le lien vers le brouillon. « Continue preparing »
   est donc dans une section dédiée, pas sur chaque ligne vidéo.
5. **Surface mobile.** La règle du dépôt demande de régénérer `base-be/docs/MOBILE_CONTRACT_SURFACE.md` quand le SDK
   ajoute des routes. Je ne l'ai pas fait : le backend ne devait pas être modifié. C'est à faire côté backend.

## 6. Limites de vérification

- Aucun test lancé ni écrit (Jest, SDK, navigateur, E2E). Aucun envoi réel lancé par moi.
  Damien a regardé l'écran lui-même sur son serveur local pendant les itérations d'interface.
- Vérifié : `tsc --noEmit` du SDK et du web (0 erreur), ESLint sur les fichiers modifiés
  (0 erreur ; 1 avertissement qui existait déjà dans `useUploadQueue`).
- Les corrections des deux revues (miniature, adresse, reprise d'un autre navigateur, verrou d'onglets,
  chargement tardif, numéros de miniature) sont vérifiées par relecture et typecheck seulement.
- Non diagnostiqué : l'origine du message `ResizeObserver` signalé en revue.
- Tests existants probablement touchés, non vérifiés : `UploadQueueContext.test.tsx` (le fournisseur crée maintenant
  reconnexion, verrou d'onglets et moteur de brouillons), `useUploadQueue.test.ts` (relance au retour réseau ou d'onglet),
  `UploadQueuePanel.test.tsx` (libellé « Hold next uploads »), tests de navigation (« Add videos »).

## 7. Limitations connues

- Les anciens composants `VideoUpload.tsx` et la page `ContentStudio` restent dans le code, mais plus aucune route
  ne les affiche (leurs tests y font encore référence). `ContentStudio` exporte toujours la ligne réutilisée pour
  « Earlier uploads ». Leur suppression est un nettoyage à part.
- Plusieurs onglets : un verrou par tentative empêche deux envois simultanés. En revanche, les enregistrements locaux
  de la file restent partagés entre onglets, comme avant.
- Reconnexion Clerk : elle est détectée au retour sur l'onglet, puis vérifiée toutes les 10 s tant qu'elle est attendue.
  Pour Web3, le parcours de connexion existant est utilisé.
- L'avertissement natif avant fermeture dépend du navigateur ; aucune promesse n'est affichée à ce sujet.
- La limite de 5 000 caractères de la description compte le HTML produit par l'éditeur riche.
- Publication individuelle uniquement ; pas de publication groupée.
- Hors périmètre du sprint, dans un commit séparé : la liste des pays Stripe du Content Pass Hub utilise
  le même menu déroulant du Creator Hub (`HubSelect`) que le choix de chaîne, à la place de la liste native du navigateur.

## 8. Dépendances backend restantes

- Déployer le backend `8f4a2732` et appliquer les deux migrations additives avant ce frontend.
  Sinon les routes `creator-drafts` répondent 404, et l'espace affiche les messages d'échec de création.
- Configurer le stockage privé `draft-media/` (droits PUT, GET, HEAD et DELETE décrits dans le contrat).
- Régénérer la surface du contrat mobile (point 5.5).

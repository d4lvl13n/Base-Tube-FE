# Sprint UP-UX — Préparer et publier ses vidéos dans un seul espace

Date : 13 octobre 2026.
Statut : spécification initiale conservée ; sprint implémenté et fusionné dans main.
La livraison et les écarts sont décrits dans [UPLOAD_WORKSPACE_DELIVERY.md](UPLOAD_WORKSPACE_DELIVERY.md).
Tâche : UX/UI web, intégration du SDK et gestion des interruptions dans le navigateur.
Unité de livraison : un sprint, sans estimation calendaire.
Dépendance : [UP-BE — Brouillon durable et fiabilité](../../basetube/base-be/docs/SPRINT_UPLOAD_BACKEND.md).

## 1. Résultat attendu

Le créateur dépose une ou plusieurs vidéos, prépare leur titre, description et miniature pendant
le transfert, retrouve son travail et choisit explicitement quand publier. Il comprend toujours
ce que BaseTube fait, ce qui est sauvegardé et ce qui demande son intervention.

La logique du workspace Amazing Aerial est adaptée à la publication vidéo : transfert immédiat,
sélection continue, édition dans le même espace et action finale explicite. Les ensembles de shooting,
classifications stock et étapes de curation ne sont pas repris.

## 2. Consigne d'exécution

Cette livraison est documentaire. Aucun lancement ni écriture de tests sans demande explicite de
Damien, y compris tests UI ou automatisation navigateur à visée de test. Les critères ci-dessous
définissent le comportement cible ; leur rédaction n'autorise pas leur exécution.
Ne pas lancer l'application, un upload réel ou un déploiement pour cette tâche de rédaction.

## 3. Périmètre

Inclus : écran unifié individuel/multiple, édition persistante, aperçu, choix de miniature,
publication explicite, reprise des transferts, reconnexion, navigation et adaptation tactile.

Hors sprint : application mobile native, notifications externes, upload après fermeture effective
du navigateur, programmation, non-répertorié, configuration de Content Pass, nouveaux générateurs IA,
gestion de séries/playlists et édition collective avancée. Les outils IA existants sont réutilisés.

Le sprint UX dépend du contrat UP-BE pour la sauvegarde et la publication réelles. La structure visuelle
peut être développée avant sa disponibilité ; aucune démonstration locale ne vaut intégration réelle.

## 4. Entrées, routes et continuité

- L'action principale « Ajouter des vidéos » ouvre l'espace commun ; aucune question préalable
  « individuel ou multiple ».
- Conserver les liens existants vers l'upload individuel et Content Studio : ils ouvrent le même
  espace directement. Les chemins exacts sont ceux du routeur existant, sans casser les favoris.
- Route de détail proposée : `/creator-hub/uploads/:draftId` ; l'identité affichée est celle du
  brouillon durable, pas celle d'une tentative ni d'un index de file locale.
- Videos Management conserve son rôle de bibliothèque. Une action « Continuer la préparation »
  ouvre le brouillon exact ; elle n'envoie pas vers une liste générique.
- Changer de page dans BaseTube conserve la file globale. Un panneau réduit permet de retrouver
  les transferts, les préparations et les actions requises.
- La liste de brouillons est hydratée depuis le serveur, même si IndexedDB est vide ou sur un autre
  appareil. Les octets encore absents nécessitent le fichier original sur l'appareil utilisé.
- Un nouveau dépôt crée un nouveau brouillon. Il n'adopte pas arbitrairement le dernier upload actif.
- Une reprise utilise une action explicite attachée à la ligne existante ; elle ne crée pas de doublon.

## 5. Hiérarchie de l'écran

### 5.1 État vide

Afficher la chaîne de destination au-dessus de la zone de dépôt, puis une grande cible :
« Déposez vos vidéos » / « Choisir des fichiers ».
Afficher MP4, MOV, AVI et 2 Go maximum par vidéo à proximité immédiate.
En l'absence de chaîne, expliquer le prérequis et proposer la création/sélection via le parcours
existant. Ne pas afficher un dépôt utilisable dont le refus arriverait ensuite.

### 5.2 Une vidéo

```text
Ajouter des vidéos                          Chaîne : Damien
                                            Brouillon enregistré

┌───────────────────────────┬──────────────────────────────────┐
│ Aperçu de la vidéo        │ Titre                            │
│                           │                                  │
│ Transfert · 64 %          │ Description                      │
│ Explication / action      │                                  │
│                           │ Miniature                        │
│                           │ [Automatique] [Importer] [IA]    │
├───────────────────────────┴──────────────────────────────────┤
│ Options supplémentaires                                      │
├──────────────────────────────────────────────────────────────┤
│ Fermer                         Prévisualiser       Publier    │
└──────────────────────────────────────────────────────────────┘
```

L'aperçu montre le média quand il est disponible. Un second mode « Présentation » montre le couple
titre + miniature dans une carte de vidéo. Il n'invente ni vues, ni revenus, ni engagement.
Le formulaire ne disparaît pas à la fin du transfert.

### 5.3 Plusieurs vidéos

Ajouter une liste latérale de vidéos au même éditeur. Chaque ligne montre miniature ou placeholder,
titre, état technique, état éditorial et éventuelle action requise. Un clic sélectionne la vidéo.
Les champs restent individuels ; aucun titre ou miniature n'est appliqué aux autres implicitement.

Ajouter des fichiers ne réinitialise pas la vidéo en cours d'édition. Un fichier refusé n'empêche pas
les autres de démarrer. Le récapitulatif indique chacun des fichiers ignorés et son motif.
Conserver les plafonds existants de file et de session ; les présenter comme limites concrètes.

La publication est individuelle dans ce sprint. La liste peut comporter simultanément des vidéos
publiées, des brouillons prêts et des transferts ; aucune publication collective implicite.

### 5.4 Petits écrans

- À partir de 1200 px : liste latérale si nécessaire, aperçu et éditeur côte à côte.
- De 768 à 1199 px : liste compacte escamotable, aperçu et champs empilés si l'espace manque.
- Sous 768 px : liste puis vue d'édition, avec retour explicite ; conserver la sélection et la position.
- Les actions de pied restent accessibles sans couvrir les champs, les erreurs ou le clavier logiciel.
- Aucune action indispensable dépend du survol. Cibles tactiles d'au moins 44 × 44 px.

## 6. Dépôt et création du brouillon

1. Vérifier format, taille et capacité de file localement ; afficher un motif par refus.
2. Créer une identité locale stable et la persister avant la première requête.
3. Réserver le brouillon serveur avec `clientDraftId` ; réserver sa tentative avec `clientAttemptId`.
4. Démarrer immédiatement les morceaux autorisés ; le formulaire est déjà utilisable.
5. Les changements saisis avant la réponse de création restent associés à cette identité locale
   et sont envoyés au brouillon retourné. Une réponse tardive ne réinitialise pas les champs.

Le titre initial utilise le nom de fichier sans extension et reste modifiable.
La chaîne attachée est visible et fixe après création. Le sélecteur global ne déplace pas les
uploads existants ; il ne concerne que les prochains ajouts. Ne pas afficher une chaîne différente
de la destination réelle sur le brouillon ouvert.

## 7. Autosave et conflits

- Les champs sont sauvegardés après 800 ms d'inactivité et lors de la sortie du champ.
- Sérialiser les mutations d'un même brouillon et fusionner les modifications en attente.
- Utiliser `expectedRevision` ; mettre à jour la révision depuis la réponse serveur.
- Une réponse ancienne ne remplace jamais du texte tapé depuis son départ.
- La file locale conserve les modifications non acquittées, isolées par compte.
- Afficher « Enregistrement… » jusqu'au commit confirmé ; puis « Brouillon enregistré ».
- En cas d'échec, afficher « Modifications non enregistrées » avec « Réessayer ». Conserver les champs.
- Hors connexion : « Modifications conservées sur cet appareil. Enregistrement à la reconnexion. »
  uniquement si la persistance locale a réellement réussi. Sinon, expliquer que quitter perdrait ces edits.
- Sur conflit de révision : conserver la version locale, montrer la version serveur et proposer
  « Recharger la version enregistrée » ou « Conserver mes modifications » après présentation de l'écart.
  Cette dernière action réapplique explicitement les valeurs sur la révision courante ; aucune fusion silencieuse.
- Avant de changer de vidéo, conserver le brouillon local. Un échec de sauvegarde reste signalé
  sur sa ligne, sans bloquer le travail sur les autres vidéos.
- Avant publication, vider les modifications en attente et attendre leur confirmation. Si elle manque,
  rester dans l'éditeur et expliquer le blocage ; ne pas afficher de succès ni naviguer.

Pour une vidéo déjà publiée, afficher « Vidéo publiée — les modifications enregistrées sont visibles ».
Le sprint ne propose pas une seconde version de travail de cette vidéo. Le retrait en brouillon
est une action distincte, explicite et confirmée.

## 8. Miniature et assistance IA

Placer la miniature près du titre et de l'aperçu. Trois choix : poster automatique lorsqu'il est
disponible, image JPEG/PNG importée (5 Mo maximum), outil IA existant.
Le choix arbitraire d'une frame de timeline est différé : ce sprint utilise le poster généré existant.

Une image importée est enregistrée immédiatement comme asset de brouillon, indépendamment du
`videoId`, puis sélectionnée avec contrôle de révision. Montrer son état d'envoi et sa confirmation.
Le fichier en attente est persisté localement sous forme de Blob lorsque disponible ; si le navigateur
refuse cette persistance, l'indiquer et demander de le sélectionner à nouveau après rechargement.
Ne jamais afficher une miniature comme enregistrée sur la seule foi d'une Data URL locale.

La sélection la plus récente gagne dans l'éditeur : une ancienne génération ou un ancien upload lent
ne peut pas remplacer le choix effectué ensuite. Une erreur conserve l'aperçu local, propose de
réessayer ou de revenir au poster automatique et n'interrompt pas le transfert vidéo.

Les outils IA s'ouvrent à la demande. Une proposition de titre/description n'est appliquée qu'après
acceptation ; elle ne remplace pas les éditions intervenues entre-temps sans le signaler. La vidéo
reste modifiable et publiable manuellement si l'IA est indisponible. Une génération dépendante du
média attend sa disponibilité et explique ce prérequis. Les résultats d'une autre vidéo ne s'appliquent
jamais à la vidéo nouvellement sélectionnée.

## 9. Deux états séparés, partout

État technique : transfert, vérification, préparation, lecture disponible ou intervention requise.
État éditorial : brouillon privé ou publié. « Prêt à publier » est une disponibilité calculée à partir
des blocages serveur et de l'absence de modifications locales en attente, pas un nouveau statut persistant.

| Situation | Message de référence en français | Action principale |
|---|---|---|
| En attente | « En attente d'envoi » | Annuler |
| Transfert | « Envoi de la vidéo · 64 % » | Annuler |
| Réseau absent | « Connexion interrompue. Reprise automatique dès son retour. » | Attendre |
| Session expirée | « Reconnectez-vous pour continuer. Votre progression est conservée. » | Se reconnecter |
| Fichier absent après reload | « Sélectionnez le même fichier pour reprendre l'envoi. » | Choisir le fichier |
| Confirmation en cours | « Vérification de la réception du fichier… » | Attendre |
| Transfert confirmé | « Vidéo reçue. Préparation de la lecture en cours. » | Continuer l'édition |
| Lecture prête | « Lecture disponible · Brouillon privé » | Prévisualiser |
| Traitement échoué | « La préparation a échoué. Votre fichier est conservé. » si vrai côté serveur | Relancer la préparation |
| Reprise expirée | « Cet envoi a expiré. Vos informations sont conservées. » | Envoyer de nouveau le fichier |
| Publication confirmée | « Vidéo publiée » | Voir la vidéo / Copier le lien |

Adapter la copie à la langue de l'application via ses conventions ; ces phrases définissent le sens.
Ne pas montrer une réponse brute serveur ni un code technique comme explication principale.
Le texte d'erreur utile est complet, avec une action visible ; un détail technique facultatif peut
contenir un identifiant de support. Un fichier bloqué ne bloque pas les autres.

Afficher un pourcentage uniquement pour les octets envoyés. Ne pas inventer de pourcentage ou de
temps restant de transcodage. Le total d'un lot ne doit pas laisser croire que ses vidéos sont publiées.

## 10. Reprise, session et file globale

- Conserver le moteur multipart et ses preuves serveur ; ne pas renvoyer les morceaux confirmés.
- Ajouter un état local d'attente d'authentification, sans changer les enums serveur existants.
- Sur un refus d'authentification reconnu : une seule tentative de renouvellement Clerk partagée
  entre requêtes ; ensuite afficher la reconnexion et suspendre les appels de contrôle concernés.
- Le parcours Web3 utilise sa reconnexion existante. Un 403 ou un 404 n'est pas transformé en demande
  de reconnexion. Une réponse de mutation perdue se résout par état/idempotence, pas par replay aveugle.
- Une reconnexion au même compte reprend la tentative. Un changement de compte interrompt l'activité
  du précédent et isole ses fichiers, ses Blobs et ses modifications locales.
- Les événements online/retour d'onglet déclenchent une réconciliation bornée, sans boucle de retries.
- Conserver quatre fichiers actifs et trois morceaux simultanés par fichier, limites existantes ;
  ce sprint ne promet pas une accélération non mesurée.
- Plusieurs onglets du même compte ne transfèrent pas simultanément la même tentative : lease locale
  par tentative, renouvelée avec expiration et signalisation inter-onglets. Après disparition du propriétaire,
  reprendre en relisant l'état serveur. Les révisions protègent séparément les modifications éditoriales.
- Dans ce sprint, la commande globale s'appelle « Suspendre les prochains envois » : les transferts
  déjà actifs continuent. Ne pas conserver le libellé ambigu « Pause » pour ce comportement.
- Annuler un transfert attend la confirmation serveur. Pendant ce délai, afficher « Annulation… ».
  Si l'issue est incertaine, conserver la ligne et proposer la vérification ; ne pas annoncer « Annulé ».
- Le brouillon et ses métadonnées restent présents après annulation. « Supprimer le brouillon » est
  une action distincte avec confirmation, puis reflète la suppression durable demandée au serveur.

## 11. Navigation et fermeture

Pendant l'envoi : « Gardez cet onglet ouvert. Vous pouvez naviguer dans BaseTube. »
Après `transferConfirmed=true` et sauvegarde de tous les champs/assets :
« Votre vidéo est reçue et votre brouillon enregistré. Vous pouvez fermer cet onglet. »

Ne pas afficher cette seconde promesse lorsque seuls les morceaux sont à 100 %, lorsqu'une miniature
reste locale ou lorsqu'une modification n'est pas enregistrée.
Un départ interne conserve l'édition locale et le transfert ; le panneau global reste disponible.
Une fermeture/recharge avec octets ou modifications non durables à risque utilise l'avertissement
natif du navigateur quand celui-ci le permet. Ne pas promettre sa disponibilité sur tous les appareils.

## 12. Publication explicite

Le bouton « Publier » concerne la vidéo sélectionnée. Il est accompagné des raisons de blocage :
lecture indisponible, titre invalide, sauvegarde en attente, miniature sélectionnée non enregistrée,
restriction serveur. Ne pas exiger description, tags ou miniature personnalisée pour publier.

À l'action : finir l'autosave, figer la révision concernée, empêcher une deuxième commande locale et
envoyer un `clientOperationId` durable. Une perte de réponse affiche « Vérification de la publication… »
et réutilise cette identité. Aucun succès sur simple fin de transfert.

Après confirmation, montrer « Vidéo publiée », un accès à la vidéo et son lien. Ne pas rediriger
automatiquement hors de l'espace si d'autres vidéos restent à préparer. Le formulaire permet de
continuer, avec l'avertissement d'édition d'un contenu publié décrit plus haut.

## 13. Accessibilité et intégration visuelle

Réutiliser le thème Creator Hub, les composants et conventions de l'application. Aucun nouveau
design system. Labels explicites, focus visible, sélection indépendante des boutons supprimer/reprendre,
annonces accessibles de changements significatifs sans lire chaque variation du pourcentage.
La couleur ne porte jamais seule un statut. Le clavier permet sélection, ouverture, fermeture des
panneaux et accès à chaque action. Préserver le focus après retrait d'une ligne.

Les champs texte ne doivent pas déclencher de raccourcis globaux. Les raccourcis de productivité
avancés d'AA et l'édition collective sont différés après livraison du parcours principal.

## 14. Lots de travail du sprint

| Lot | Livraison |
|---|---|
| UX-1 | Espace commun, entrées historiques, liste de brouillons et navigation par identité stable |
| UX-2 | Éditeur et aperçu responsive ; destination réelle toujours visible |
| UX-3 | Autosave acquitté, file locale, conflits et persistance des miniatures |
| UX-4 | SDK du nouveau contrat, reprise réseau/auth, isolation compte et coordination des onglets |
| UX-5 | États et actions de récupération, panneau global, protection des sorties à risque |
| UX-6 | Publication individuelle explicite et transition depuis les anciens écrans |

Ces lots appartiennent au même sprint UX ; ce ne sont pas des sprints supplémentaires.
Le SDK est livré dans ce dépôt ; les formes et règles métier restent celles d'UP-BE.

## 15. Critères d'acceptation fonctionnelle

- Une ou plusieurs vidéos utilisent le même parcours et commencent à partir sans attendre le formulaire.
- Le créateur peut travailler sur titre, description et miniature pendant le transfert.
- La fin du transfert ne quitte pas l'éditeur et ne publie pas la vidéo.
- Une vidéo prête affiche distinctement sa disponibilité de lecture et son état de brouillon.
- Le retour à un brouillon restaure les valeurs serveur et préserve les modifications locales non acquittées.
- Chaque erreur indique ce qui est conservé et l'action utile, sans réclamer systématiquement un nouvel upload.
- Une miniature non enregistrée ne disparaît pas silencieusement et ne remplace pas une sélection plus récente.
- La chaîne affichée correspond toujours à la destination du brouillon.
- Une reprise après reconnexion utilise la même tentative, sous le même compte.
- Les actions essentielles sont visibles et utilisables au clavier et au tactile.
- Une publication ne peut concerner la mauvaise vidéo après un changement de sélection.
- Les liens existants restent utilisables et les anciens transferts restent visibles jusqu'à leur résolution.

## 16. Intégration et livraison

Utiliser directement le nouveau parcours et les endpoints UP-BE après leur déploiement et migration.
Ne pas ajouter de feature flag, de vérification de capacité ni de shadow mode.
Les uploads historiques restent représentés par la file existante et leurs actions adaptées ; ne pas
les convertir implicitement en brouillons ni changer leur visibilité. Retirer les anciens écrans
du parcours seulement lorsque leurs entrées sont prises en charge, en conservant les liens.

Fin de sprint : livrer les changements UX et SDK, les chemins d'entrée, la matrice des états couverts
et les limitations connues. La présente spec n'affirme ni intégration, ni déploiement.

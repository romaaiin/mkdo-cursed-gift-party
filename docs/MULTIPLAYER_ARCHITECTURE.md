# Architecture multijoueur MKDO

## Décisions
- Backend : Supabase (Auth, PostgreSQL, Realtime, Edge Functions).
- Modes prévus : matchmaking public mondial et salons privés par code à 6 caractères.
- Identité : invité (session anonyme Supabase) ou compte durable (e-mail/mot de passe).
- Capacité initiale : 2 à 4 joueurs, configurable, 4 par défaut.
- Source de vérité cible : serveur. Le navigateur ne doit jamais écrire le résultat d'une action ni l'état privé d'une partie.

## Infrastructure provisionnée
- Projet Supabase : `jjffnvexrnichsfayhnf`, région Paris (`eu-west-3`), organisation RG Org, plan Free.
- Tables : `mkdo_profiles`, `mkdo_rooms`, `mkdo_room_members`, `mkdo_game_states`.
- Deux migrations appliquées : fondation multijoueur et durcissement des permissions.
- Edge Function `room-api` déployée avec vérification JWT.
- Clé publishable utilisée côté navigateur : jamais de clé `service_role` dans le frontend.
- Le client de la branche pointe par défaut vers ce projet; les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` peuvent surcharger la configuration.

## Modèle de données
- `mkdo_profiles` : pseudo et avatar.
- `mkdo_rooms` : code, visibilité, hôte, capacité, statut, configuration et version d'état.
- `mkdo_room_members` : joueurs, siège et présence.
- `mkdo_game_states` : état privé non exposé aux rôles clients. Les projections de partie doivent être générées côté serveur et masquer les mains adverses.

Les fonctions SQL transactionnelles gèrent la création, l'entrée par code et le matchmaking. Les écritures directes du navigateur sont interdites. Les fonctions `SECURITY DEFINER` sont réservées au rôle authentifié et contrôlent `auth.uid()`; la fonction utilitaire d'appartenance est dans le schéma privé.

## Flux implémenté à ce stade
1. Le client crée une session invitée ou ouvre une session e-mail/mot de passe.
2. Matchmaking : recherche transactionnelle d'une salle publique en attente, ou création d'une salle.
3. Salle privée : création et partage du code; entrée par code.
4. La fonction Edge renvoie les métadonnées du salon et son roster.
5. Le client renouvelle le jeton de session avant expiration.
6. Le lobby actualise actuellement son état par polling toutes les 2,5 secondes.

## Travaux obligatoires avant une partie jouable
- Activer les connexions anonymes dans Supabase Auth (Dashboard > Authentication > Providers > Anonymous Sign-Ins). Cette bascule n'est pas exposée par l'outil de gestion connecté.
- Tester réellement deux identités distinctes sur Auth, création, matchmaking et entrée par code.
- Remplacer le polling par Supabase Realtime.
- Implémenter le démarrage de partie, les actions autoritaires, l'anti-rejeu via `state_version`, les projections privées par joueur et les ripostes côté serveur.
- Intégrer le plateau `GameBoard` à une session réseau sans laisser le client calculer ou publier un état faisant autorité.
- Gérer reconnexion, départ, expiration et nettoyage des salons.
- Ajouter limitation de débit et CAPTCHA avant ouverture publique.

## Sécurité
- Ne jamais exposer `service_role` ou une clé secrète dans le navigateur.
- RLS activée sur toutes les tables du schéma public.
- `mkdo_game_states` reste inaccessible aux rôles clients.
- Ne jamais diffuser l'état brut : les mains adverses sont confidentielles.
- Vérifier l'identité, le siège, le tour, les cartes et la version d'état pour chaque action.

## Déploiement
Le projet Supabase existe et la base ainsi que `room-api` sont déployées. La configuration Auth anonyme doit encore être activée manuellement dans le Dashboard. Le client utilise la clé publishable et l'URL du projet en configuration par défaut.

## Coûts et exploitation
Le projet est actuellement sur l'offre Free. Aucun passage à une offre payante n'a été demandé. Surveiller les quotas, les pauses de projet, la charge Realtime, les utilisateurs actifs, le stockage et les appels Edge. Réévaluer le coût uniquement à partir d'une charge mesurée avant lancement public.

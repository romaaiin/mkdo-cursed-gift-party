# Architecture multijoueur MKDO

## Décisions
- Backend : Supabase (Auth, PostgreSQL, Realtime, Edge Functions).
- Modes : matchmaking public mondial et salons privés par code à 6 caractères.
- Identité : invité (session anonyme Supabase) ou compte durable (email/mot de passe, puis OAuth éventuel).
- Capacité initiale : 2 à 4 joueurs, configurable, à confirmer selon les règles finales.
- Source de vérité : serveur. Le client ne doit jamais écrire directement le résultat d'une action ni le champ `game_state`.

## Modèle de données
- `mkdo_profiles` : pseudo et avatar.
- `mkdo_rooms` : code, visibilité, hôte, capacité, statut, configuration et version d'état.
- `mkdo_room_members` : joueurs, siège et présence.
- `mkdo_rooms.game_state` : état serveur uniquement, non lisible par les autres joueurs via une policy directe. Une Edge Function devra produire une vue filtrée par joueur pour ne jamais révéler les mains adverses.

La migration initiale ajoute les tables, les index, les règles RLS et les fonctions transactionnelles de création, de rejoindre par code et de matchmaking. Les mutations sont refusées directement depuis le navigateur.

## Flux
1. Le client crée une session invitée Supabase ou ouvre une session de compte.
2. Matchmaking : recherche transactionnelle d'une salle publique en attente, ou création d'une nouvelle salle.
3. Partie privée : l'hôte crée une salle privée et partage le code; les amis la rejoignent.
4. Realtime diffuse les changements de roster et de statut.
5. Une Edge Function vérifie l'identité, le siège, le tour, la carte jouée et la riposte, applique le moteur et incrémente `state_version`.
6. Le serveur envoie à chaque joueur une projection de l'état qui masque les mains adverses.
7. Reconnexion : relecture de la projection courante; déconnexion temporaire conserve le siège pendant une période définie.

## Sécurité obligatoire avant ouverture publique
- Auth anonyme activée et fournisseur email configuré dans Supabase.
- Secrets `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` uniquement côté Edge Functions.
- RLS activée; aucun accès client direct en écriture à l'état.
- Validation serveur de toutes les actions; anti-rejeu via `state_version`.
- Limitation de débit des créations de salles et tentatives de code.
- Expiration/nettoyage des salles inactives.
- Ne jamais diffuser `game_state` brut : les mains adverses sont confidentielles.

## Déploiement
1. Créer le projet Supabase dans la région Europe (Frankfurt/Paris si disponible).
2. Configurer Auth : anonymous + email/password; définir URLs de redirection.
3. Appliquer `supabase/migrations/20261031000100_mkdo_multiplayer.sql`.
4. Déployer les Edge Functions et renseigner les variables d'environnement publiques du client.
5. Tester avec deux comptes navigateurs distincts et un client mobile avant activation du bouton en production.

## Coûts et exploitation
Le plan Free peut suffire au prototype et aux premiers tests. Pour un jeu public, budgéter une offre payante dès que la disponibilité, la rétention et les limites de connexions/Realtime du plan gratuit deviennent insuffisantes. Mesurer MAU, connexions simultanées, messages Realtime, stockage et appels Edge avant engagement financier.

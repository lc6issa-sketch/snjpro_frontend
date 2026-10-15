// Fichier genere automatiquement depuis les DTO Java du backend SNJPro (scripts/generer-modeles.js).
// Ne pas modifier a la main : relancer le generateur apres un changement cote backend.

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export type EtatColonne = 'AUTO' | 'A_VERIFIER' | 'IGNOREE';
export const EtatColonne_VALUES: EtatColonne[] = ['AUTO', 'A_VERIFIER', 'IGNOREE'];

export type TypeCodeVerification = 'CONNEXION' | 'ACTIVATION' | 'REINITIALISATION' | 'VERIFICATION_TELEPHONE' | 'INVITATION';
export const TypeCodeVerification_VALUES: TypeCodeVerification[] = ['CONNEXION', 'ACTIVATION', 'REINITIALISATION', 'VERIFICATION_TELEPHONE', 'INVITATION'];

export type StatutMobilisation = 'BROUILLON' | 'PLANIFIEE' | 'EN_COURS' | 'CLOTUREE';
export const StatutMobilisation_VALUES: StatutMobilisation[] = ['BROUILLON', 'PLANIFIEE', 'EN_COURS', 'CLOTUREE'];

export type ReponseMobilisation = 'EN_ATTENTE' | 'DISPONIBLE' | 'INDISPONIBLE';
export const ReponseMobilisation_VALUES: ReponseMobilisation[] = ['EN_ATTENTE', 'DISPONIBLE', 'INDISPONIBLE'];

export type TypeNotification = 'INFORMATION' | 'URGENT' | 'MOBILISATION' | 'ACTUALITE';
export const TypeNotification_VALUES: TypeNotification[] = ['INFORMATION', 'URGENT', 'MOBILISATION', 'ACTUALITE'];

export type CibleNotification = 'TOUS' | 'REGION' | 'COHORTE' | 'SELECTION';
export const CibleNotification_VALUES: CibleNotification[] = ['TOUS', 'REGION', 'COHORTE', 'SELECTION'];

export type StatutNotification = 'BROUILLON' | 'PROGRAMMEE' | 'ENVOYEE';
export const StatutNotification_VALUES: StatutNotification[] = ['BROUILLON', 'PROGRAMMEE', 'ENVOYEE'];

export type CategorieActualite = 'ANNONCE' | 'OPPORTUNITE' | 'MOBILISATION' | 'RAPPORT';
export const CategorieActualite_VALUES: CategorieActualite[] = ['ANNONCE', 'OPPORTUNITE', 'MOBILISATION', 'RAPPORT'];

export type StatutActualite = 'BROUILLON' | 'PROGRAMMEE' | 'PUBLIEE' | 'ARCHIVEE';
export const StatutActualite_VALUES: StatutActualite[] = ['BROUILLON', 'PROGRAMMEE', 'PUBLIEE', 'ARCHIVEE'];

export type TypeOpportunite = 'EMPLOI' | 'STAGE' | 'FORMATION';
export const TypeOpportunite_VALUES: TypeOpportunite[] = ['EMPLOI', 'STAGE', 'FORMATION'];

export type StatutOpportunite = 'BROUILLON' | 'OUVERTE' | 'CLOTUREE';
export const StatutOpportunite_VALUES: StatutOpportunite[] = ['BROUILLON', 'OUVERTE', 'CLOTUREE'];

export type StatutCandidature = 'NOUVELLE' | 'PRESELECTIONNEE' | 'ENTRETIEN' | 'RETENUE' | 'NON_RETENUE';
export const StatutCandidature_VALUES: StatutCandidature[] = ['NOUVELLE', 'PRESELECTIONNEE', 'ENTRETIEN', 'RETENUE', 'NON_RETENUE'];

export type VisibiliteDocument = 'MEMBRES' | 'INTERNE' | 'PUBLIC';
export const VisibiliteDocument_VALUES: VisibiliteDocument[] = ['MEMBRES', 'INTERNE', 'PUBLIC'];

export type TypeDocument = 'ATTESTATION' | 'DIPLOME' | 'IDENTITE' | 'PHOTO' | 'CARTE_MEMBRE' | 'CV' | 'AUTRE';
export const TypeDocument_VALUES: TypeDocument[] = ['ATTESTATION', 'DIPLOME', 'IDENTITE', 'PHOTO', 'CARTE_MEMBRE', 'CV', 'AUTRE'];

export type TypeDemande = 'MISE_A_JOUR_PROFIL' | 'ATTESTATION' | 'CARTE_MEMBRE' | 'RECLAMATION' | 'AUTRE';
export const TypeDemande_VALUES: TypeDemande[] = ['MISE_A_JOUR_PROFIL', 'ATTESTATION', 'CARTE_MEMBRE', 'RECLAMATION', 'AUTRE'];

export type StatutDemande = 'EN_ATTENTE' | 'EN_COURS' | 'COMPLEMENT_DEMANDE' | 'ACCEPTEE' | 'REJETEE';
export const StatutDemande_VALUES: StatutDemande[] = ['EN_ATTENTE', 'EN_COURS', 'COMPLEMENT_DEMANDE', 'ACCEPTEE', 'REJETEE'];

export type StatutActivite = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';
export const StatutActivite_VALUES: StatutActivite[] = ['PLANIFIEE', 'EN_COURS', 'TERMINEE'];

export type ModePresence = 'QR_CODE' | 'CODE' | 'MANUEL';
export const ModePresence_VALUES: ModePresence[] = ['QR_CODE', 'CODE', 'MANUEL'];

export type TypeConversation = 'DIRECTE' | 'GROUPE' | 'SERVICE';
export const TypeConversation_VALUES: TypeConversation[] = ['DIRECTE', 'GROUPE', 'SERVICE'];

export type StatutImport = 'ANALYSE' | 'VERIFIE' | 'TERMINE' | 'ANNULE';
export const StatutImport_VALUES: StatutImport[] = ['ANALYSE', 'VERIFIE', 'TERMINE', 'ANNULE'];

export type DecisionDoublon = 'IGNORER' | 'FUSIONNER' | 'CONSERVER_LES_DEUX';
export const DecisionDoublon_VALUES: DecisionDoublon[] = ['IGNORER', 'FUSIONNER', 'CONSERVER_LES_DEUX'];

export type FormatFichier = 'XLSX' | 'CSV' | 'PDF';
export const FormatFichier_VALUES: FormatFichier[] = ['XLSX', 'CSV', 'PDF'];

export type TypeRapport = 'EFFECTIFS_COHORTES' | 'COMPETENCES' | 'MOBILISATIONS' | 'PROFILS_INCOMPLETS' | 'STATISTIQUES_COHORTES';
export const TypeRapport_VALUES: TypeRapport[] = ['EFFECTIFS_COHORTES', 'COMPETENCES', 'MOBILISATIONS', 'PROFILS_INCOMPLETS', 'STATISTIQUES_COHORTES'];

export type StatutSouvenir = 'EN_ATTENTE' | 'PUBLIE' | 'REJETE';
export const StatutSouvenir_VALUES: StatutSouvenir[] = ['EN_ATTENTE', 'PUBLIE', 'REJETE'];

export type TypeMedia = 'PHOTO' | 'VIDEO' | 'AUDIO';
export const TypeMedia_VALUES: TypeMedia[] = ['PHOTO', 'VIDEO', 'AUDIO'];

export type NiveauCompetenceEnum = 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE' | 'EXPERT';
export const NiveauCompetenceEnum_VALUES: NiveauCompetenceEnum[] = ['DEBUTANT', 'INTERMEDIAIRE', 'AVANCE', 'EXPERT'];

export type RoleEnum = 'ROLE_ADMIN_SYSTEME' | 'ROLE_ADMIN_SNJ' | 'ROLE_DIRECTION' | 'ROLE_RESPONSABLE_REGIONAL' | 'ROLE_RESPONSABLE_COHORTE' | 'ROLE_MEMBRE' | 'ROLE_PARTENAIRE';
export const RoleEnum_VALUES: RoleEnum[] = ['ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_DIRECTION', 'ROLE_RESPONSABLE_REGIONAL', 'ROLE_RESPONSABLE_COHORTE', 'ROLE_MEMBRE', 'ROLE_PARTENAIRE'];

export type SexeEnum = 'MASCULIN' | 'FEMININ';
export const SexeEnum_VALUES: SexeEnum[] = ['MASCULIN', 'FEMININ'];

export type StatutCohorteEnum = 'EN_FORMATION' | 'EN_RESERVE' | 'LIBEREE' | 'ACTIVE' | 'TERMINEE' | 'ARCHIVEE';
export const StatutCohorteEnum_VALUES: StatutCohorteEnum[] = ['EN_FORMATION', 'EN_RESERVE', 'LIBEREE', 'ACTIVE', 'TERMINEE', 'ARCHIVEE'];

export type StatutMembreEnum = 'ACTIF' | 'INACTIF' | 'ARCHIVE' | 'DECEDE' | 'SUSPENDU';
export const StatutMembreEnum_VALUES: StatutMembreEnum[] = ['ACTIF', 'INACTIF', 'ARCHIVE', 'DECEDE', 'SUSPENDU'];

export type StatutProfessionnelEnum = 'EMPLOYE' | 'AUTO_EMPLOYE' | 'CHOMEUR' | 'ETUDIANT' | 'RETRAITE' | 'AUTRE';
export const StatutProfessionnelEnum_VALUES: StatutProfessionnelEnum[] = ['EMPLOYE', 'AUTO_EMPLOYE', 'CHOMEUR', 'ETUDIANT', 'RETRAITE', 'AUTRE'];

export interface AuthResponse {
  token?: string;
  type?: string;
  expiresInMs?: number;
  userId?: number;
  username?: string;
  email?: string;
  prenom?: string;
  nom?: string;
  role?: RoleEnum;
  region?: string;
  cohorteId?: number;
  membreId?: number;
  photoUrl?: string;
  telephone?: string;
  doubleAuthentification?: boolean;
  deuxiemeFacteurRequis?: boolean;
  telephoneMasque?: string;
  message?: string;
}

export interface ChangementMotDePasseDTO {
  ancienMotDePasse?: string;
  nouveauMotDePasse?: string;
}

export interface CohorteDTO {
  id?: number;
  nom?: string;
  code?: string;
  description?: string;
  anneeDebut?: number;
  anneeFin?: number;
  dateDebut?: string;
  dateFin?: string;
  statut?: StatutCohorteEnum;
  region?: string;
  responsable?: string;
  numero?: number;
  centre?: string;
  recruesInitiales?: number;
  nombreCompagnies?: number;
  nombreSections?: number;
  responsableId?: number;
  responsableNom?: string;
  membresActifs?: number;
  pourcentageProfilsAJour?: number;
  nombreMembres?: number;
}

export interface CompetenceDTO {
  id?: number;
  membreId?: number;
  intitule?: string;
  categorie?: string;
  niveau?: NiveauCompetenceEnum;
  description?: string;
}

export interface CompteMembreDTO {
  username?: string;
  password?: string;
  email?: string;
}

export interface DoublonGroupeDTO {
  criteresDetection?: string;
  scoreSimilarite?: number;
  membres?: MembreResponseDTO[];
}

export interface ImportResultDTO {
  simulation?: boolean;
  totalLignes?: number;
  importesAvecSucces?: number;
  lignesIgnorees?: number;
  doublonsDetectes?: number;
  colonnesReconnues?: string[];
  colonnesIgnorees?: string[];
  identifiantsCrees?: string[];
  erreurs?: ImportResultDTO.ImportErreurDTO[];
  message?: string;
}

export interface InvitationDTO {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  role?: RoleEnum;
  region?: string;
  cohorteId?: number;
  message?: string;
  username?: string;
  motDePasse?: string;
}

export interface LocalisationDTO {
  id?: number;
  membreId?: number;
  pays?: string;
  region?: string;
  cercle?: string;
  commune?: string;
  quartier?: string;
  adresseComplete?: string;
}

export interface LoginRequest {
  username?: string;
  password?: string;
}

export interface MembreDTO {
  id?: number;
  identifiantSnj?: string;
  prenom?: string;
  nom?: string;
  sexe?: SexeEnum;
  dateNaissance?: string;
  lieuNaissance?: string;
  numeroTelephone?: string;
  email?: string;
  photoUrl?: string;
  telephoneSecondaire?: string;
  personneAPrevenir?: string;
  personneAPrevenirTelephone?: string;
  nationalite?: string;
  groupeSanguin?: string;
  taille?: number;
  poids?: number;
  dernierDiplome?: string;
  diplomes?: string[];
  categorie?: string;
  compagnie?: string;
  section?: string;
  brigade?: string;
  dateIncorporation?: string;
  disponibleMobilisation?: boolean;
  statut?: StatutMembreEnum;
  cohorteId?: number;
}

export interface MembreFilterDTO {
  query?: string;
  cohorteId?: number;
  statut?: StatutMembreEnum;
  sexe?: SexeEnum;
  region?: string;
  competence?: string;
  statutProfessionnel?: StatutProfessionnelEnum;
  profession?: string;
  secteurActivite?: string;
}

export interface MembreResponseDTO {
  id?: number;
  identifiantSnj?: string;
  prenom?: string;
  nom?: string;
  sexe?: SexeEnum;
  dateNaissance?: string;
  lieuNaissance?: string;
  numeroTelephone?: string;
  email?: string;
  photoUrl?: string;
  telephoneSecondaire?: string;
  telephoneVerifie?: boolean;
  personneAPrevenir?: string;
  personneAPrevenirTelephone?: string;
  nationalite?: string;
  groupeSanguin?: string;
  taille?: number;
  poids?: number;
  dernierDiplome?: string;
  diplomes?: string[];
  categorie?: string;
  compagnie?: string;
  section?: string;
  brigade?: string;
  dateIncorporation?: string;
  disponibleMobilisation?: boolean;
  statut?: StatutMembreEnum;
  cohorteId?: number;
  cohorteNom?: string;
  userId?: number;
  situationProfessionnelle?: SituationProfessionnelleDTO;
  localisation?: LocalisationDTO;
  dateCreation?: string;
  dateModification?: string;
  tauxCompletude?: number;
}

export interface MiseAJourProfilDTO {
  numeroTelephone?: string;
  email?: string;
  photoUrl?: string;
}

export interface NouveauMotDePasseDTO {
  nouveauMotDePasse?: string;
}

export interface ParcoursSNJDTO {
  id?: number;
  membreId?: number;
  intitule?: string;
  type?: string;
  description?: string;
  dateDebut?: string;
  dateFin?: string;
  lieu?: string;
}

export interface ProfilMembreDTO {
  membre?: MembreResponseDTO;
  competences?: CompetenceDTO[];
  parcours?: ParcoursSNJDTO[];
  tauxCompletude?: number;
}

export interface SituationProfessionnelleDTO {
  id?: number;
  membreId?: number;
  statut?: StatutProfessionnelEnum;
  profession?: string;
  secteurActivite?: string;
  nomEmployeur?: string;
  description?: string;
  dateDebutActivite?: string;
}

export interface UserDTO {
  id?: number;
  username?: string;
  password?: string;
  email?: string;
  prenom?: string;
  nom?: string;
  role?: RoleEnum;
  region?: string;
  cohorteId?: number;
}

export interface UserResponseDTO {
  id?: number;
  username?: string;
  email?: string;
  prenom?: string;
  nom?: string;
  role?: RoleEnum;
  actif?: boolean;
  region?: string;
  cohorteId?: number;
  derniereConnexion?: string;
  dateCreation?: string;
  dateModification?: string;
  createdBy?: string;
  telephone?: string;
  photoUrl?: string;
  invitationEnAttente?: boolean;
  doubleAuthentification?: boolean;
}

export interface Enumerations {
}

export namespace ActiviteDTOs {
  export interface Edition {
    titre?: string;
    description?: string;
    date?: string;
    dateFin?: string;
    heureDebut?: string;
    heureFin?: string;
    lieu?: string;
    region?: string;
    mobilisationId?: number;
    qrActif?: boolean;
  }
  export interface SaisieManuelle {
    membreId?: number;
    heureArrivee?: string;
    motif?: string;
  }
  export interface Pointage {
    qr?: string;
    code?: string;
    scanneLe?: string;
  }
  export interface Compteurs {
    inscrits?: number;
    presents?: number;
    tauxPresence?: number;
    arriveesDerniereHeure?: number;
    absentsExcuses?: number;
    saisiesManuelles?: number;
  }
  export interface Resume {
    id?: number;
    titre?: string;
    description?: string;
    date?: string;
    dateFin?: string;
    heureDebut?: string;
    heureFin?: string;
    lieu?: string;
    region?: string;
    statut?: StatutActivite;
    mobilisationId?: number;
    mobilisation?: string;
    qrActif?: boolean;
    compteurs?: Compteurs;
  }
  export interface PresenceDTO {
    id?: number;
    membreId?: number;
    identifiantSnj?: string;
    prenom?: string;
    nom?: string;
    dateHeure?: string;
    mode?: ModePresence;
    motif?: string;
    saisiePar?: string;
  }
  export interface CodeQr {
    activiteId?: number;
    code?: string;
    contenuQr?: string;
    secondesRestantes?: number;
    valableJusqua?: string;
  }
  export interface Projection {
    activite?: Resume;
    codeQr?: CodeQr;
    dernieresArrivees?: PresenceDTO[];
  }
  export interface ConfirmationPresence {
    activiteId?: number;
    activite?: string;
    organisateur?: string;
    lieu?: string;
    arrivee?: string;
    mode?: ModePresence;
    ajouteeAuParcours?: boolean;
    dejaEnregistree?: boolean;
  }
}

export namespace ActualiteDTOs {
  export interface Edition {
    titre?: string;
    sousTitre?: string;
    contenu?: string;
    categorie?: CategorieActualite;
    statut?: StatutActualite;
    datePublication?: string;
    dateExpiration?: string;
    cible?: CibleNotification;
    valeurs?: string[];
    notifierMembres?: boolean;
    epingle?: boolean;
    inscriptionsOuvertes?: boolean;
  }
  export interface Resume {
    id?: number;
    titre?: string;
    sousTitre?: string;
    extrait?: string;
    categorie?: CategorieActualite;
    statut?: StatutActualite;
    imageUrl?: string;
    auteur?: string;
    datePublication?: string;
    dateModification?: string;
    vues?: number;
    epingle?: boolean;
    minutesLecture?: number;
  }
  export interface Detail {
    resume?: Resume;
    contenu?: string;
    dateExpiration?: string;
    cible?: CibleNotification;
    valeurs?: string[];
    notifierMembres?: boolean;
    inscriptionsOuvertes?: boolean;
    nombreInscrits?: number;
    nombreMots?: number;
    inscrit?: boolean;
  }
  export interface Compteurs {
    toutes?: number;
    publiees?: number;
    brouillons?: number;
    programmees?: number;
    archivees?: number;
  }
  export interface Inscrit {
    membreId?: number;
    identifiantSnj?: string;
    prenom?: string;
    nom?: string;
    telephone?: string;
    dateInscription?: string;
  }
}

export namespace AuthAvanceDTOs {
  export interface ConnexionTelephone {
    telephone?: string;
    motDePasse?: string;
  }
  export interface DemandeCode {
    identifiant?: string;
  }
  export interface VerificationCodeConnexion {
    identifiant?: string;
    code?: string;
    faireConfianceAppareil?: boolean;
  }
  export interface Telephone {
    telephone?: string;
    identifiantSnj?: string;
  }
  export interface Email {
    email?: string;
  }
  export interface VerificationTelephone {
    telephone?: string;
    code?: string;
  }
  export interface Code {
    code?: string;
  }
  export interface JetonEtape {
    jeton?: string;
    message?: string;
  }
  export interface Reinitialisation {
    jeton?: string;
    nouveauMotDePasse?: string;
  }
  export interface Activation {
    jeton?: string;
    motDePasse?: string;
  }
  export interface AcceptationInvitation {
    jeton?: string;
    username?: string;
    motDePasse?: string;
  }
  export interface InfoInvitation {
    email?: string;
    prenom?: string;
    nom?: string;
    role?: string;
    perimetre?: string;
  }
  export interface MonCompte {
    prenom?: string;
    nom?: string;
    email?: string;
    telephone?: string;
  }
  export interface DoubleAuthentification {
    actif?: boolean;
    telephone?: string;
  }
  export interface Session {
    id?: number;
    appareil?: string;
    adresseIp?: string;
    dateCreation?: string;
    sessionActuelle?: boolean;
  }
  export interface Preference {
    evenement?: string;
    libelle?: string;
    application?: boolean;
    email?: boolean;
    sms?: boolean;
  }
  export interface Preferences {
    preferences?: Preference[];
  }
}

export namespace CompetenceReferentielDTOs {
  export interface Edition {
    nom?: string;
    categorie?: string;
    description?: string;
  }
  export interface Competence {
    id?: number;
    nom?: string;
    categorie?: string;
    description?: string;
    nombreMembres?: number;
    niveauMoyen?: number;
    anneeAjout?: number;
  }
  export interface Categorie {
    nom?: string;
    nombreCompetences?: number;
    nombreMembres?: number;
  }
  export interface Detenteur {
    membreId?: number;
    identifiantSnj?: string;
    prenom?: string;
    nom?: string;
    region?: string;
    cohorte?: string;
    niveau?: string;
  }
}

export namespace DemandeDTOs {
  export interface Modification {
    champ?: string;
    ancienne?: string;
    nouvelle?: string;
  }
  export interface Nouvelle {
    type?: TypeDemande;
    objet?: string;
    description?: string;
    modifications?: Modification[];
  }
  export interface Validation {
    reponse?: string;
    appliquerModification?: boolean;
  }
  export interface Rejet {
    motif?: string;
    message?: string;
  }
  export interface Complement {
    elements?: string[];
    message?: string;
    delaiJours?: number;
  }
  export interface Evenement {
    libelle?: string;
    commentaire?: string;
    auteur?: string;
    date?: string;
  }
  export interface Resume {
    id?: number;
    numeroSuivi?: string;
    type?: TypeDemande;
    objet?: string;
    statut?: StatutDemande;
    membreId?: number;
    membre?: string;
    identifiantSnj?: string;
    dateCreation?: string;
    dateTraitement?: string;
    reponse?: string;
    etape?: number;
  }
  export interface Detail {
    resume?: Resume;
    description?: string;
    cohorte?: string;
    telephone?: string;
    modifications?: Modification[];
    pieceJointeId?: number;
    pieceJointeNom?: string;
    pieceJointeTaille?: number;
    motifRejet?: string;
    elementsDemandes?: string[];
    dateLimiteComplement?: string;
    traitePar?: string;
    delaiEstime?: string;
    suivi?: Evenement[];
  }
  export interface Statistiques {
    enAttente?: number;
    enCours?: number;
    complementsDemandes?: number;
    traiteesCeMois?: number;
    delaiMoyenJours?: number;
  }
}

export namespace DocumentDTOs {
  export interface Fichier {
    contenu?: string;
    nom?: string;
    typeMime?: string;
  }
  export interface DossierEdition {
    nom?: string;
    visibiliteDefaut?: VisibiliteDocument;
  }
  export interface DocumentEdition {
    titre?: string;
    dossierId?: number;
    visibilite?: VisibiliteDocument;
  }
  export interface DossierDTO {
    id?: number;
    nom?: string;
    visibiliteDefaut?: VisibiliteDocument;
    nombreDocuments?: number;
  }
  export interface DocumentDTO {
    id?: number;
    titre?: string;
    nomFichier?: string;
    extension?: string;
    typeMime?: string;
    taille?: number;
    dossierId?: number;
    dossier?: string;
    visibilite?: VisibiliteDocument;
    typeDocument?: TypeDocument;
    verifie?: boolean;
    nouveau?: boolean;
    ajoutePar?: string;
    dateAjout?: string;
    urlTelechargement?: string;
  }
  export interface Espace {
    utiliseOctets?: number;
    quotaOctets?: number;
    pourcentage?: number;
  }
  export interface DocumentsMembre {
    documents?: DocumentDTO[];
    piecesManquantes?: TypeDocument[];
  }
  export interface MesDocuments {
    personnels?: DocumentDTO[];
    duSnj?: DocumentDTO[];
  }
}

export namespace EspaceMembreDTOs {
  export interface Completude {
    taux?: number;
    complet?: boolean;
    elementsManquants?: string[];
  }
  export interface Accueil {
    membre?: MembreResponseDTO;
    completude?: Completude;
    mobilisationEnCours?: MobilisationDTOs.MaMobilisation;
    mobilisationsEnAttenteDeReponse?: number;
    aLaUne?: ActualiteDTOs.Resume;
    actualitesRecentes?: ActualiteDTOs.Resume[];
    activitesDuJour?: ActiviteDTOs.Resume[];
    notificationsNonLues?: number;
    messagesNonLus?: number;
    demandesEnCours?: number;
    candidaturesEnCours?: number;
  }
  export interface Carte {
    membreId?: number;
    identifiantSnj?: string;
    prenom?: string;
    nom?: string;
    photoUrl?: string;
    dateNaissance?: string;
    groupeSanguin?: string;
    cohorte?: string;
    compagnie?: string;
    section?: string;
    dateIncorporation?: string;
    statut?: string;
    region?: string;
    qrContenu?: string;
    dateEmission?: string;
  }
  export interface VerificationCarte {
    valide?: boolean;
    message?: string;
    membreId?: number;
    identifiantSnj?: string;
    nomComplet?: string;
    photoUrl?: string;
    cohorte?: string;
    statut?: string;
  }
  export interface Cv {
    membre?: MembreResponseDTO;
    titre?: string;
    competences?: CompetenceDTO[];
    parcours?: ParcoursSNJDTO[];
    engagements?: string[];
  }
  export interface Disponibilite {
    disponible?: boolean;
  }
}

export namespace ImportAssistantDTOs {
  export interface Colonne {
    entete?: string;
    exemple?: string;
    champ?: string;
    etat?: EtatColonne;
  }
  export interface Champ {
    cle?: string;
    libelle?: string;
    obligatoire?: boolean;
  }
  export interface Session {
    id?: number;
    nomFichier?: string;
    taille?: number;
    cohorteId?: number;
    cohorteNom?: string;
    statut?: StatutImport;
    totalLignes?: number;
    importes?: number;
    fusionnes?: number;
    ignores?: number;
    erreurs?: number;
    doublons?: number;
    creePar?: string;
    dateCreation?: string;
    dateImport?: string;
  }
  export interface Analyse {
    session?: Session;
    colonnes?: Colonne[];
    champsDisponibles?: Champ[];
    champsObligatoiresManquants?: string[];
    apercu?: Record<string, string>;
  }
  export interface CorrespondanceRequest {
    correspondance?: Record<string, string>;
  }
  export interface ErreurLigne {
    ligne?: number;
    champ?: string;
    valeur?: string;
    message?: string;
    suggestion?: string;
  }
  export interface Comparaison {
    champ?: string;
    valeurFichier?: string;
    valeurExistante?: string;
    identique?: boolean;
  }
  export interface DoublonLigne {
    ligne?: number;
    nomFichier?: string;
    membreExistantId?: number;
    identifiantSnj?: string;
    nomExistant?: string;
    score?: number;
    motifs?: string[];
    comparaison?: Comparaison[];
    decision?: DecisionDoublon;
  }
  export interface Verification {
    session?: Session;
    totalLignes?: number;
    lignesValides?: number;
    lignesEnErreur?: number;
    doublonsDetectes?: number;
    doublonsSansDecision?: number;
    erreurs?: ErreurLigne[];
    doublons?: DoublonLigne[];
  }
  export interface DecisionRequest {
    decision?: DecisionDoublon;
  }
  export interface Resultat {
    session?: Session;
    identifiantsCrees?: string[];
    identifiantsFusionnes?: string[];
    erreurs?: ErreurLigne[];
    message?: string;
  }
}

export namespace ImportResultDTO {
  export interface ImportErreurDTO {
    numeroLigne?: number;
    champ?: string;
    valeur?: string;
    message?: string;
  }
}

export namespace MessagerieDTOs {
  export interface NouvelleConversation {
    destinataireUserId?: number;
    membreId?: number;
    service?: string;
    participantsUserIds?: number[];
    titre?: string;
    premierMessage?: string;
  }
  export interface NouveauMessage {
    contenu?: string;
  }
  export interface ConversationDTO {
    id?: number;
    type?: TypeConversation;
    titre?: string;
    sousTitre?: string;
    initiales?: string;
    enLigne?: boolean;
    dernierMessage?: string;
    dernierMessageLe?: string;
    nonLus?: number;
    participants?: number[];
    membreId?: number;
  }
  export interface MessageDTO {
    id?: number;
    conversationId?: number;
    auteurId?: number;
    auteur?: string;
    deMoi?: boolean;
    contenu?: string;
    pieceJointeTaille?: number;
    pieceJointeNom?: string;
    pieceJointeUrl?: string;
    dateEnvoi?: string;
    lu?: boolean;
  }
  export interface Contact {
    type?: string;
    userId?: number;
    membreId?: number;
    nom?: string;
    detail?: string;
    service?: string;
    enLigne?: boolean;
    delaiReponse?: string;
    identifiantSnj?: string;
    cohorteNom?: string;
    memeCohorte?: boolean;
    region?: string;
    localisation?: string;
  }
}

export namespace MobilisationDTOs {
  export interface Informations {
    titre?: string;
    description?: string;
    typeBesoin?: string;
    organisateur?: string;
    dateDebut?: string;
    dateFin?: string;
    heureRendezVous?: string;
    lieu?: string;
    region?: string;
    nombreVolontaires?: number;
    dateLimiteReponse?: string;
    priseEnCharge?: string[];
    urgent?: boolean;
  }
  export interface Criteres {
    regions?: string[];
    competences?: string[];
    toutesCompetences?: boolean;
    cohorteIds?: number[];
    statutsMembre?: StatutMembreEnum[];
    sexe?: SexeEnum;
    ageMin?: number;
    ageMax?: number;
    telephoneVerifieUniquement?: boolean;
    exclureDejaMobilises?: boolean;
  }
  export interface Envoi {
    message?: string;
    canalApplication?: boolean;
    canalSms?: boolean;
    canalEmail?: boolean;
    programmeLe?: string;
    membresExclus?: number[];
  }
  export interface Cloture {
    remercierParticipants?: boolean;
    ajouterAuParcours?: boolean;
  }
  export interface ReponseMembre {
    disponible?: boolean;
    motif?: string;
  }
  export interface Compteurs {
    sollicites?: number;
    disponibles?: number;
    indisponibles?: number;
    sansReponse?: number;
    tauxReponse?: number;
  }
  export interface Resume {
    id?: number;
    titre?: string;
    typeBesoin?: string;
    lieu?: string;
    region?: string;
    dateDebut?: string;
    dateFin?: string;
    statut?: StatutMobilisation;
    urgent?: boolean;
    envoiProgrammeLe?: string;
    nombreCibles?: number;
    compteurs?: Compteurs;
  }
  export interface Detail {
    id?: number;
    informations?: Informations;
    criteres?: Criteres;
    envoi?: Envoi;
    statut?: StatutMobilisation;
    compteurs?: Compteurs;
    objectif?: number;
    tauxObjectif?: number;
    dateEnvoi?: string;
    dateRelance?: string;
    dateCloture?: string;
    creePar?: string;
    reponsesParJour?: Record<string, number>;
  }
  export interface Statistiques {
    enCours?: number;
    planifiees?: number;
    cloturees?: number;
    membresSollicitesAnnee?: number;
    tauxReponse?: number;
    delaiMoyenReponseHeures?: number;
    disponiblesConfirmes?: number;
    pourcentageDisponibles?: number;
  }
  export interface MembreSelectionne {
    membreId?: number;
    identifiantSnj?: string;
    prenom?: string;
    nom?: string;
    region?: string;
    cohorte?: string;
    competencesCorrespondantes?: string[];
    telephoneVerifie?: boolean;
  }
  export interface Apercu {
    total?: number;
    parRegion?: Record<string, number>;
    pourcentageFemmes?: number;
    pourcentageTelephoneVerifie?: number;
    estimationSms?: number;
    membres?: MembreSelectionne[];
  }
  export interface Participant {
    participationId?: number;
    membreId?: number;
    identifiantSnj?: string;
    prenom?: string;
    nom?: string;
    region?: string;
    competence?: string;
    reponse?: ReponseMobilisation;
    motif?: string;
    dateReponse?: string;
  }
  export interface MaMobilisation {
    id?: number;
    titre?: string;
    description?: string;
    organisateur?: string;
    lieu?: string;
    dateDebut?: string;
    dateFin?: string;
    heureRendezVous?: string;
    dateLimiteReponse?: string;
    urgent?: boolean;
    statut?: StatutMobilisation;
    nombreVolontaires?: number;
    placesConfirmees?: number;
    profilRecherche?: string[];
    pourquoiVous?: string[];
    priseEnCharge?: string[];
    maReponse?: ReponseMobilisation;
    dateReponse?: string;
  }
}

export namespace NotificationDTOs {
  export interface Envoi {
    type?: TypeNotification;
    titre?: string;
    message?: string;
    cible?: CibleNotification;
    valeurs?: string[];
    canalApplication?: boolean;
    canalSms?: boolean;
    canalEmail?: boolean;
    programmeLe?: string;
    brouillon?: boolean;
  }
  export interface Resume {
    id?: number;
    titre?: string;
    message?: string;
    type?: TypeNotification;
    cible?: CibleNotification;
    valeurs?: string[];
    destinatairesLibelle?: string;
    canaux?: string[];
    statut?: StatutNotification;
    programmeLe?: string;
    dateEnvoi?: string;
    nombreDestinataires?: number;
    nombreLus?: number;
    tauxLecture?: number;
    emetteur?: string;
  }
  export interface Statistiques {
    envoyeesCeMois?: number;
    tauxLectureMoyen?: number;
    smsEnvoyesCeMois?: number;
    programmees?: number;
  }
  export interface Estimation {
    nombreDestinataires?: number;
    nombreSms?: number;
  }
  export interface MaNotification {
    id?: number;
    titre?: string;
    message?: string;
    type?: TypeNotification;
    lu?: boolean;
    date?: string;
    lienType?: string;
    lienId?: number;
  }
  export interface Alerte {
    id?: number;
    titre?: string;
    message?: string;
    type?: string;
    lienType?: string;
    lienId?: number;
    lu?: boolean;
    date?: string;
  }
}

export namespace OpportuniteDTOs {
  export interface Edition {
    type?: TypeOpportunite;
    intitule?: string;
    organisation?: string;
    lieu?: string;
    typeContrat?: string;
    dateLimite?: string;
    description?: string;
    competences?: string[];
    publicCible?: string;
    region?: string;
    notifierMembres?: boolean;
    portailPublic?: boolean;
    publier?: boolean;
  }
  export interface Resume {
    id?: number;
    type?: TypeOpportunite;
    intitule?: string;
    organisation?: string;
    lieu?: string;
    typeContrat?: string;
    dateLimite?: string;
    competences?: string[];
    statut?: StatutOpportunite;
    nombreCandidatures?: number;
    vues?: number;
    datePublication?: string;
    score?: number;
    favori?: boolean;
    candidatureEnvoyee?: boolean;
  }
  export interface Detail {
    resume?: Resume;
    description?: string;
    publicCible?: string;
    region?: string;
    notifierMembres?: boolean;
    portailPublic?: boolean;
    membresNotifies?: number;
    publiePar?: string;
    competencesCorrespondantes?: string[];
  }
  export interface Compteurs {
    toutes?: number;
    emplois?: number;
    stages?: number;
    formations?: number;
  }
  export interface CandidatureDTO {
    id?: number;
    opportuniteId?: number;
    opportunite?: string;
    organisation?: string;
    membreId?: number;
    identifiantSnj?: string;
    prenom?: string;
    nom?: string;
    score?: number;
    statut?: StatutCandidature;
    message?: string;
    dateCandidature?: string;
  }
  export interface Postuler {
    message?: string;
  }
}

export namespace RoleDTOs {
  export interface Permission {
    module?: string;
    libelle?: string;
    voir?: boolean;
    creer?: boolean;
    modifier?: boolean;
    supprimer?: boolean;
  }
  export interface Role {
    role?: RoleEnum;
    libelle?: string;
    description?: string;
    perimetre?: string;
    nombreUtilisateurs?: number;
    modulesAccessibles?: string[];
    permissions?: Permission[];
  }
  export interface Permissions {
    permissions?: Permission[];
  }
}

export namespace SouvenirDTOs {
  export interface Edition {
    titre?: string;
    legende?: string;
    cohorteId?: number;
    datePrise?: string;
    lieu?: string;
    visibleTous?: boolean;
  }
  export interface Rejet {
    motif?: string;
  }
  export interface Media {
    id?: number;
    type?: TypeMedia;
    nomFichier?: string;
    typeMime?: string;
    taille?: number;
  }
  export interface Resume {
    id?: number;
    titre?: string;
    legende?: string;
    cohorteId?: number;
    cohorteNom?: string;
    datePrise?: string;
    lieu?: string;
    statut?: StatutSouvenir;
    visibleTous?: boolean;
    auteurNom?: string;
    auteurMembreId?: number;
    auteurIdentifiantSnj?: string;
    envoyeParMembre?: boolean;
    motifRejet?: string;
    moderePar?: string;
    dateModeration?: string;
    dateCreation?: string;
    medias?: Media[];
    nombrePhotos?: number;
    nombreVideos?: number;
    nombreAudios?: number;
  }
  export interface Statistiques {
    publies?: number;
    enAttente?: number;
    rejetes?: number;
    photos?: number;
    videos?: number;
    audios?: number;
  }
  export interface Fichier {
    contenu?: string;
    nom?: string;
    typeMime?: string;
  }
}

export namespace StatistiqueDTOs {
  export interface Filtres {
    annee?: number;
    cohorteId?: number;
    region?: string;
    sexe?: SexeEnum;
  }
  export interface Libelle {
    libelle?: string;
    valeur?: number;
    pourcentage?: number;
  }
  export interface Kpi {
    valeur?: number;
    evolutionPourcentage?: number;
    detail?: string;
  }
  export interface ActiviteRecente {
    titre?: string;
    description?: string;
    type?: string;
    utilisateur?: string;
    entite?: string;
    entiteId?: number;
    date?: string;
  }
  export interface TableauDeBord {
    membresEnregistres?: Kpi;
    cohortes?: number;
    cohortesParStatut?: Record<string, number>;
    pourcentageProfilsComplets?: number;
    profilsComplets?: number;
    membresMobilisables?: Kpi;
    disponiblesCetteSemaine?: number;
    evolutionEffectifs?: Record<string, number>;
    repartitionSexe?: Libelle[];
    repartitionRegions?: Libelle[];
    topCompetences?: Libelle[];
    nombreCompetences?: number;
    activiteRecente?: ActiviteRecente[];
  }
  export interface TrancheAge {
    tranche?: string;
    hommes?: number;
    femmes?: number;
    pourcentageHommes?: number;
    pourcentageFemmes?: number;
  }
  export interface Statistiques {
    totalMembres?: number;
    repartitionGeographique?: Libelle[];
    pyramideAges?: TrancheAge[];
    situationProfessionnelle?: Libelle[];
    profilsAvecSituation?: number;
    completudeParAnnee?: Record<string, number>;
    repartitionSexe?: Libelle[];
    parCohorte?: Libelle[];
  }
  export interface DemandeRapport {
    type?: TypeRapport;
    du?: string;
    au?: string;
    region?: string;
    format?: FormatFichier;
  }
  export interface RapportDTO {
    id?: number;
    titre?: string;
    type?: TypeRapport;
    format?: FormatFichier;
    periode?: string;
    region?: string;
    taille?: number;
    generePar?: string;
    dateGeneration?: string;
    automatique?: boolean;
    urlTelechargement?: string;
  }
  export interface Export {
    format?: FormatFichier;
    sections?: string[];
    masquerDonneesSensibles?: boolean;
    filtres?: MembreFilterDTO;
  }
  export interface EstimationExport {
    nombreMembres?: number;
    tailleEstimeeOctets?: number;
  }
}

export namespace Historique {
  export interface OperationDTO {
    id?: number;
    action?: string;
    entite?: string;
    entiteId?: number;
    details?: string;
    utilisateur?: string;
    adresseIp?: string;
    dateAction?: string;
    champsModifies?: Record<string, string>[];
    restaurable?: boolean;
  }
}

export namespace RechercheGlobale {
  export interface Resultats {
    recherche?: string;
    membres?: MembreResponseDTO[];
    totalMembres?: number;
    utilisateurs?: UserResponseDTO[];
    cohortes?: CohorteDTO[];
  }
}


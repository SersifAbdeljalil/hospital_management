-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 29 jan. 2026 à 23:59
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `hospital_management`
--

-- --------------------------------------------------------

--
-- Structure de la table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `medecin_id` int(11) NOT NULL,
  `date_heure` datetime NOT NULL,
  `duree_minutes` int(11) DEFAULT 30,
  `statut` enum('planifie','confirme','en_cours','termine','annule','non_presente') DEFAULT 'planifie',
  `motif` varchar(255) DEFAULT NULL,
  `type_consultation` enum('premiere_visite','suivi','urgence','controle') DEFAULT 'premiere_visite',
  `notes` text DEFAULT NULL,
  `salle` varchar(50) DEFAULT NULL,
  `rappel_envoye` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `annule_at` timestamp NULL DEFAULT NULL,
  `annule_par` int(11) DEFAULT NULL,
  `raison_annulation` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `appointments`
--

INSERT INTO `appointments` (`id`, `patient_id`, `medecin_id`, `date_heure`, `duree_minutes`, `statut`, `motif`, `type_consultation`, `notes`, `salle`, `rappel_envoye`, `created_by`, `created_at`, `updated_at`, `annule_at`, `annule_par`, `raison_annulation`) VALUES
(1, 1, 2, '2026-02-05 09:00:00', 30, 'planifie', 'Consultation de suivi diabète', 'suivi', NULL, 'A101', 0, NULL, '2026-01-29 12:17:21', '2026-01-29 12:17:21', NULL, NULL, NULL),
(2, 1, 2, '2026-02-10 14:30:00', 30, 'confirme', 'Contrôle tension artérielle', 'controle', NULL, 'A102', 0, NULL, '2026-01-29 12:17:21', '2026-01-29 18:57:40', NULL, NULL, NULL),
(3, 2, 2, '2026-02-06 10:00:00', 30, 'en_cours', 'Première consultation', 'premiere_visite', NULL, 'A103', 0, NULL, '2026-01-29 12:17:21', '2026-01-29 18:31:23', NULL, NULL, NULL),
(4, 1, 2, '2026-01-20 11:00:00', 30, 'termine', 'Consultation générale', 'suivi', NULL, 'A101', 0, NULL, '2026-01-29 12:17:21', '2026-01-29 12:17:21', NULL, NULL, NULL),
(5, 2, 2, '2026-01-22 15:00:00', 30, 'termine', 'Bilan de santé', 'premiere_visite', NULL, 'A102', 0, NULL, '2026-01-29 12:17:21', '2026-01-29 12:17:21', NULL, NULL, NULL),
(6, 3, 2, '2026-01-30 09:00:00', 30, 'planifie', 'ok', 'premiere_visite', 'ok', NULL, 0, NULL, '2026-01-29 18:57:36', '2026-01-29 18:57:36', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(100) NOT NULL,
  `record_id` int(11) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `consultations`
--

CREATE TABLE `consultations` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `patient_id` int(11) NOT NULL,
  `medecin_id` int(11) NOT NULL,
  `date_consultation` datetime NOT NULL,
  `motif_consultation` text DEFAULT NULL,
  `temperature` decimal(4,1) DEFAULT NULL,
  `tension_arterielle_systolique` int(11) DEFAULT NULL,
  `tension_arterielle_diastolique` int(11) DEFAULT NULL,
  `frequence_cardiaque` int(11) DEFAULT NULL,
  `frequence_respiratoire` int(11) DEFAULT NULL,
  `poids` decimal(5,2) DEFAULT NULL,
  `taille` int(11) DEFAULT NULL,
  `imc` decimal(5,2) DEFAULT NULL,
  `saturation_oxygene` int(11) DEFAULT NULL,
  `examen_clinique` text DEFAULT NULL,
  `symptomes` text DEFAULT NULL,
  `diagnostic` text DEFAULT NULL,
  `diagnostic_code_cim10` varchar(10) DEFAULT NULL,
  `observations` text DEFAULT NULL,
  `examens_demandes` text DEFAULT NULL,
  `traitement_propose` text DEFAULT NULL,
  `conduite_a_tenir` text DEFAULT NULL,
  `prochain_rdv_recommande` date DEFAULT NULL,
  `arret_travail_jours` int(11) DEFAULT NULL,
  `statut` enum('en_cours','terminee','annulee') DEFAULT 'en_cours',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `consultations`
--

INSERT INTO `consultations` (`id`, `appointment_id`, `patient_id`, `medecin_id`, `date_consultation`, `motif_consultation`, `temperature`, `tension_arterielle_systolique`, `tension_arterielle_diastolique`, `frequence_cardiaque`, `frequence_respiratoire`, `poids`, `taille`, `imc`, `saturation_oxygene`, `examen_clinique`, `symptomes`, `diagnostic`, `diagnostic_code_cim10`, `observations`, `examens_demandes`, `traitement_propose`, `conduite_a_tenir`, `prochain_rdv_recommande`, `arret_travail_jours`, `statut`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 2, '2026-01-20 11:00:00', 'Consultation de suivi diabète', 36.8, 140, 90, NULL, NULL, 78.50, 175, NULL, NULL, NULL, NULL, 'Diabète type 2 contrôlé, ajustement traitement recommandé', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'terminee', '2026-01-29 12:17:21', '2026-01-29 12:17:21'),
(2, 5, 2, 2, '2026-01-22 15:00:00', 'Bilan de santé annuel', 37.0, 120, 80, NULL, NULL, 72.00, 168, NULL, NULL, NULL, NULL, 'État de santé général bon, RAS', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'terminee', '2026-01-29 12:17:21', '2026-01-29 12:17:21'),
(3, NULL, 3, 2, '2026-01-29 19:00:00', 'ok', 0.0, 0, 0, 0, 0, 0.00, 0, NULL, 0, '', '', '', '', '', '', '', '', '0000-00-00', 0, 'en_cours', '2026-01-29 19:00:55', '2026-01-29 19:00:55');

-- --------------------------------------------------------

--
-- Structure de la table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `consultation_id` int(11) DEFAULT NULL,
  `nom_fichier` varchar(255) NOT NULL,
  `nom_original` varchar(255) NOT NULL,
  `type_document` enum('resultat_examen','radio','ordonnance','rapport','certificat','autre') NOT NULL,
  `type_mime` varchar(100) DEFAULT NULL,
  `taille_fichier` int(11) DEFAULT NULL,
  `chemin_fichier` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `numero_facture` varchar(50) NOT NULL,
  `consultation_id` int(11) DEFAULT NULL,
  `patient_id` int(11) NOT NULL,
  `date_emission` date NOT NULL,
  `date_echeance` date DEFAULT NULL,
  `montant_consultation` decimal(10,2) DEFAULT 0.00,
  `montant_actes` decimal(10,2) DEFAULT 0.00,
  `montant_examens` decimal(10,2) DEFAULT 0.00,
  `montant_total` decimal(10,2) NOT NULL,
  `montant_paye` decimal(10,2) DEFAULT 0.00,
  `montant_restant` decimal(10,2) DEFAULT NULL,
  `taux_tva` decimal(5,2) DEFAULT 0.00,
  `montant_ht` decimal(10,2) DEFAULT NULL,
  `montant_tva` decimal(10,2) DEFAULT NULL,
  `montant_ttc` decimal(10,2) DEFAULT NULL,
  `statut_paiement` enum('non_payee','partiellement_payee','payee','annulee') DEFAULT 'non_payee',
  `methode_paiement` enum('especes','carte_bancaire','cheque','virement','assurance','autre') DEFAULT NULL,
  `reference_paiement` varchar(100) DEFAULT NULL,
  `date_paiement` datetime DEFAULT NULL,
  `prise_en_charge_assurance` decimal(10,2) DEFAULT 0.00,
  `numero_prise_en_charge` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `pdf_path` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `statut` varchar(50) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `invoices`
--

INSERT INTO `invoices` (`id`, `numero_facture`, `consultation_id`, `patient_id`, `date_emission`, `date_echeance`, `montant_consultation`, `montant_actes`, `montant_examens`, `montant_total`, `montant_paye`, `montant_restant`, `taux_tva`, `montant_ht`, `montant_tva`, `montant_ttc`, `statut_paiement`, `methode_paiement`, `reference_paiement`, `date_paiement`, `prise_en_charge_assurance`, `numero_prise_en_charge`, `notes`, `pdf_path`, `description`, `type`, `statut`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'FAC-2026-001', 1, 1, '2026-01-20', NULL, 300.00, 0.00, 0.00, 300.00, 300.00, 0.00, 0.00, NULL, NULL, NULL, 'payee', 'carte_bancaire', NULL, '2026-01-20 11:30:00', 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-29 12:17:21', '2026-01-29 12:17:21'),
(2, 'FAC-2026-002', 2, 2, '2026-01-22', NULL, 250.00, 0.00, 0.00, 250.00, 0.00, 250.00, 0.00, NULL, NULL, NULL, 'non_payee', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-29 12:17:21', '2026-01-29 12:17:21'),
(3, 'FACT-ORD-1769719421340', NULL, 3, '2026-01-29', NULL, 0.00, 0.00, 0.00, 150.00, 150.00, 0.00, 0.00, NULL, NULL, NULL, 'payee', NULL, NULL, '2026-01-29 21:43:41', 0.00, NULL, NULL, NULL, 'Paiement ordonnance N° ORD-1769713801424-2', 'ordonnance', NULL, 4, '2026-01-29 20:43:41', '2026-01-29 20:43:41');

-- --------------------------------------------------------

--
-- Structure de la table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantite` int(11) DEFAULT 1,
  `prix_unitaire` decimal(10,2) NOT NULL,
  `montant_total` decimal(10,2) NOT NULL,
  `type_item` enum('consultation','acte','examen','medicament','autre') DEFAULT 'consultation',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `invoice_items`
--

INSERT INTO `invoice_items` (`id`, `invoice_id`, `description`, `quantite`, `prix_unitaire`, `montant_total`, `type_item`, `created_at`) VALUES
(1, 1, 'Consultation cardiologie', 1, 300.00, 300.00, 'consultation', '2026-01-29 12:17:21'),
(2, 2, 'Consultation générale', 1, 200.00, 200.00, 'consultation', '2026-01-29 12:17:21'),
(3, 2, 'Analyses sanguines', 1, 50.00, 50.00, 'examen', '2026-01-29 12:17:21');

-- --------------------------------------------------------

--
-- Structure de la table `medical_records`
--

CREATE TABLE `medical_records` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `antecedents_medicaux` text DEFAULT NULL,
  `antecedents_chirurgicaux` text DEFAULT NULL,
  `antecedents_familiaux` text DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `maladies_chroniques` text DEFAULT NULL,
  `medicaments_actuels` text DEFAULT NULL,
  `vaccinations` text DEFAULT NULL,
  `groupe_sanguin_confirme` tinyint(1) DEFAULT 0,
  `donneur_organes` tinyint(1) DEFAULT 0,
  `notes_importantes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `medical_records`
--

INSERT INTO `medical_records` (`id`, `patient_id`, `antecedents_medicaux`, `antecedents_chirurgicaux`, `antecedents_familiaux`, `allergies`, `maladies_chroniques`, `medicaments_actuels`, `vaccinations`, `groupe_sanguin_confirme`, `donneur_organes`, `notes_importantes`, `created_at`, `updated_at`) VALUES
(1, 1, 'Diabète Type 2 depuis 2020', NULL, NULL, 'Pénicilline', NULL, NULL, NULL, 1, 0, NULL, '2026-01-29 12:17:21', '2026-01-29 12:17:21'),
(2, 2, 'Aucun antécédent majeur', NULL, NULL, 'Aucune allergie connue', NULL, NULL, NULL, 1, 0, NULL, '2026-01-29 12:17:21', '2026-01-29 12:17:21');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `related_id` int(11) DEFAULT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `url_redirect` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `sender_id`, `is_read`, `read_at`, `url_redirect`, `created_at`, `updated_at`) VALUES
(1, 3, 'appointment', 'Rendez-vous confirmé', 'Votre rendez-vous du 05/02/2026 à 09:00 est confirmé', NULL, NULL, 0, NULL, NULL, '2026-01-29 12:17:21', '2026-01-29 12:17:21'),
(2, 2, 'new_patient', 'Nouveau patient', 'Un nouveau patient (Youssef El Idrissi) a pris rendez-vous', NULL, NULL, 1, NULL, NULL, '2026-01-29 12:17:21', '2026-01-29 12:17:21'),
(3, 3, 'invoice', 'Facture impayée', 'Vous avez une facture en attente de paiement (250 DH)', NULL, NULL, 0, NULL, NULL, '2026-01-29 12:17:21', '2026-01-29 12:17:21'),
(4, 4, 'appointment_created', 'Nouveau rendez-vous confirmé', 'Votre rendez-vous avec Dr. Bennani Fatima a été planifié pour le 30/01/2026 à 09:00', 6, 3, 1, NULL, NULL, '2026-01-29 18:57:36', '2026-01-29 19:03:53'),
(5, 2, 'appointment_created', 'Nouveau rendez-vous', 'Un rendez-vous avec El Idrissi Youssef a été planifié pour le 30/01/2026 à 09:00', 6, 3, 1, NULL, NULL, '2026-01-29 18:57:36', '2026-01-29 18:58:34'),
(6, 4, 'prescription_created', 'Nouvelle Ordonnance', 'Le Dr. Fatima Bennani vous a prescrit une nouvelle ordonnance. Paiement requis pour télécharger.', 2, 2, 1, NULL, NULL, '2026-01-29 19:10:01', '2026-01-29 19:10:28'),
(7, 4, 'payment_received', 'Paiement Confirmé', 'Votre paiement de 150 MAD pour l\'ordonnance N° ORD-1769713801424-2 a été confirmé. Vous pouvez maintenant télécharger votre ordonnance signée.', 2, 4, 1, NULL, NULL, '2026-01-29 20:43:41', '2026-01-29 20:56:07');

-- --------------------------------------------------------

--
-- Structure de la table `patients`
--

CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `numero_dossier` varchar(50) NOT NULL,
  `groupe_sanguin` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `numero_securite_sociale` varchar(50) DEFAULT NULL,
  `contact_urgence_nom` varchar(100) DEFAULT NULL,
  `contact_urgence_telephone` varchar(20) DEFAULT NULL,
  `contact_urgence_relation` varchar(50) DEFAULT NULL,
  `profession` varchar(100) DEFAULT NULL,
  `situation_familiale` enum('celibataire','marie','divorce','veuf') DEFAULT NULL,
  `assurance_nom` varchar(100) DEFAULT NULL,
  `assurance_numero` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `patients`
--

INSERT INTO `patients` (`id`, `user_id`, `numero_dossier`, `groupe_sanguin`, `numero_securite_sociale`, `contact_urgence_nom`, `contact_urgence_telephone`, `contact_urgence_relation`, `profession`, `situation_familiale`, `assurance_nom`, `assurance_numero`, `created_at`, `updated_at`) VALUES
(1, 3, 'P-2024-001', 'A+', NULL, 'Sara El Idrissi', '+212645678901', 'Épouse', 'Ingénieur', 'marie', NULL, NULL, '2026-01-29 12:17:20', '2026-01-29 12:17:20'),
(2, 3, 'P-2024-002', 'O+', NULL, 'Ahmed Tahiri', '+212656789012', 'Père', 'Professeur', 'celibataire', NULL, NULL, '2026-01-29 12:17:20', '2026-01-29 12:17:20'),
(3, 4, 'PAT-2026-1086', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-29 18:23:59', '2026-01-29 18:23:59'),
(4, 5, 'PAT-2026-7368', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-29 21:41:06', '2026-01-29 21:41:06'),
(5, 6, 'PAT-2026-5704', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-29 22:12:58', '2026-01-29 22:12:58');

-- --------------------------------------------------------

--
-- Structure de la table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `methode_paiement` enum('especes','carte_bancaire','cheque','virement','assurance','autre') NOT NULL,
  `reference_transaction` varchar(100) DEFAULT NULL,
  `date_paiement` datetime NOT NULL,
  `notes` text DEFAULT NULL,
  `recu_par` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `payments`
--

INSERT INTO `payments` (`id`, `invoice_id`, `montant`, `methode_paiement`, `reference_transaction`, `date_paiement`, `notes`, `recu_par`, `created_at`) VALUES
(1, 1, 300.00, 'carte_bancaire', NULL, '2026-01-20 11:30:00', NULL, NULL, '2026-01-29 12:17:21'),
(2, 3, 150.00, '', NULL, '2026-01-29 21:43:41', NULL, 4, '2026-01-29 20:43:41');

-- --------------------------------------------------------

--
-- Structure de la table `prescriptions`
--

CREATE TABLE `prescriptions` (
  `id` int(11) NOT NULL,
  `numero_ordonnance` varchar(100) NOT NULL,
  `consultation_id` int(11) DEFAULT NULL,
  `patient_id` int(11) NOT NULL,
  `medecin_id` int(11) NOT NULL,
  `diagnostic` text DEFAULT NULL,
  `medicaments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`medicaments`)),
  `instructions` text DEFAULT NULL,
  `duree_traitement` varchar(100) DEFAULT NULL,
  `statut` enum('en_attente','payee','delivree','annulee') DEFAULT 'en_attente',
  `invoice_id` int(11) DEFAULT NULL,
  `date_creation` datetime DEFAULT current_timestamp(),
  `date_prescription` date DEFAULT NULL,
  `pdf_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `prescriptions`
--

INSERT INTO `prescriptions` (`id`, `numero_ordonnance`, `consultation_id`, `patient_id`, `medecin_id`, `diagnostic`, `medicaments`, `instructions`, `duree_traitement`, `statut`, `invoice_id`, `date_creation`, `date_prescription`, `pdf_path`, `created_at`, `updated_at`) VALUES
(1, 'ORD-2026-001', 1, 1, 2, 'Diabète Type 2', '[{\"nom\": \"Metformine\", \"dosage\": \"850mg\", \"posologie\": \"1 comprimé matin et soir\", \"duree\": \"3 mois\"}, {\"nom\": \"Glibenclamide\", \"dosage\": \"5mg\", \"posologie\": \"1 comprimé le matin\", \"duree\": \"3 mois\"}]', NULL, NULL, 'delivree', NULL, '2026-01-29 13:17:21', '2026-01-20', NULL, '2026-01-29 12:17:21', '2026-01-29 12:17:21'),
(2, 'ORD-1769713801424-2', NULL, 3, 2, 'ok', '[{\"nom\":\"iuyfudiojfugvyewijodgfuy\",\"dosage\":\"500\",\"forme\":\"gélule\",\"posologie\":\"3edqegusgfd\",\"duree\":\"7 jour \"}]', 'kjhgjftdrsdtfyguhij', 'kjhgfdghjk', 'payee', 3, '2026-01-29 20:10:01', NULL, NULL, '2026-01-29 19:10:01', '2026-01-29 20:43:41');

-- --------------------------------------------------------

--
-- Structure de la table `prescription_medications`
--

CREATE TABLE `prescription_medications` (
  `id` int(11) NOT NULL,
  `prescription_id` int(11) NOT NULL,
  `nom_medicament` varchar(255) NOT NULL,
  `dosage` varchar(100) DEFAULT NULL,
  `forme` varchar(50) DEFAULT NULL,
  `posologie` text DEFAULT NULL,
  `duree` varchar(100) DEFAULT NULL,
  `moment_prise` varchar(100) DEFAULT NULL,
  `quantite` int(11) DEFAULT NULL,
  `instructions_specifiques` text DEFAULT NULL,
  `ordre_affichage` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `prescription_medications`
--

INSERT INTO `prescription_medications` (`id`, `prescription_id`, `nom_medicament`, `dosage`, `forme`, `posologie`, `duree`, `moment_prise`, `quantite`, `instructions_specifiques`, `ordre_affichage`, `created_at`) VALUES
(1, 1, 'Metformine', '850mg', 'Comprimé', '1 comprimé matin et soir après les repas', '3 mois', NULL, 180, NULL, 1, '2026-01-29 12:17:21'),
(2, 1, 'Glibenclamide', '5mg', 'Comprimé', '1 comprimé le matin à jeun', '3 mois', NULL, 90, NULL, 2, '2026-01-29 12:17:21');

-- --------------------------------------------------------

--
-- Structure de la table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `cle` varchar(100) NOT NULL,
  `valeur` text DEFAULT NULL,
  `type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `groupe` varchar(50) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `settings`
--

INSERT INTO `settings` (`id`, `cle`, `valeur`, `type`, `description`, `groupe`, `updated_at`) VALUES
(1, 'email_hopital', 'contact@hospital.com', 'string', 'Email de contact', 'general', '2026-01-29 12:17:21'),
(2, 'adresse_hopital', '123 Bd Zerktouni, Casablanca', 'string', 'Adresse complète', 'general', '2026-01-29 12:17:21'),
(3, 'telephone_hopital', '+212522123456', 'string', 'Téléphone principal', 'general', '2026-01-29 12:17:21'),
(4, 'jours_ouvres', '[\"lundi\",\"mardi\",\"mercredi\",\"jeudi\",\"vendredi\"]', 'json', 'Jours d\'ouverture', 'appointments', '2026-01-29 12:17:21'),
(5, 'rappel_rdv_heures', '24', 'number', 'Délai de rappel avant RDV (heures)', 'appointments', '2026-01-29 12:17:21');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `reset_password_token` varchar(255) DEFAULT NULL,
  `reset_password_expire` datetime DEFAULT NULL,
  `role` enum('admin','medecin','infirmier','receptionniste','patient') NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `adresse` text DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `sexe` enum('M','F','Autre') DEFAULT NULL,
  `statut` enum('actif','inactif','suspendu') DEFAULT 'actif',
  `photo_profil` varchar(255) DEFAULT NULL,
  `specialite` varchar(100) DEFAULT NULL,
  `numero_licence` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `nom`, `prenom`, `email`, `password`, `reset_password_token`, `reset_password_expire`, `role`, `telephone`, `adresse`, `date_naissance`, `sexe`, `statut`, `photo_profil`, `specialite`, `numero_licence`, `created_at`, `updated_at`, `last_login`) VALUES
(2, 'Bennani', 'Fatima', 'docteur@hospital.com', '$2b$10$JOfHl91vpPzetgqr9502F.3vp/aKY06VmbPklJGm8HHQfQPz83kdG', NULL, NULL, 'medecin', '+212623456789', NULL, NULL, NULL, 'actif', '/uploads/profiles/user_2_1769713212821-266354587.jpg', NULL, NULL, '2026-01-29 12:16:25', '2026-01-29 21:32:23', '2026-01-29 21:32:23'),
(3, 'Alami', 'Mohammed', 'admin@hospital.com', '$2b$10$6dxf/YOceXymW7PQ.MBzO.VPeSp/YD96hbnwXHL4DW15iOsVb0Yde', NULL, NULL, 'admin', '+212612345678', NULL, NULL, NULL, 'actif', NULL, NULL, NULL, '2026-01-29 12:16:30', '2026-01-29 22:56:54', '2026-01-29 22:56:54'),
(4, 'El Idrissi', 'Youssef', 'patient@hospital.com', '$2b$10$sdvhbArVReq2zPWZ.v7L..5zIqXmsKegp1/UkOFith/LxiHFSB/gK', NULL, NULL, 'patient', '+212634567890', NULL, NULL, NULL, 'actif', NULL, NULL, NULL, '2026-01-29 18:23:59', '2026-01-29 21:20:51', '2026-01-29 21:20:51'),
(5, 'sersif', 'Abdeljalil', 'abdosarsif28@gmail.com', '$2b$10$Gyf6nMQKS2xphD90guKBv.Q..PXRUgvt4V6ItSrwKAV73yDcbXIjO', NULL, NULL, 'patient', '0695489581', 'el jadida', '2002-11-28', 'M', 'actif', NULL, NULL, NULL, '2026-01-29 21:41:06', '2026-01-29 22:28:09', NULL),
(6, 'sersif', 'abdo', 'mohammedlkhouaja@gmail.com', '$2b$10$bKuPwIVuGTaqFwAig2kZN.45mvHsWOXZ4yZ5SsBXClN6xy0Y3w6BO', 'PBT36J', '2026-01-29 22:28:05', 'patient', '0548251258', 'sidufydis', '2026-01-15', 'M', 'actif', NULL, NULL, NULL, '2026-01-29 22:12:58', '2026-01-29 22:13:05', NULL);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `annule_par` (`annule_par`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_medecin_id` (`medecin_id`),
  ADD KEY `idx_date_heure` (`date_heure`),
  ADD KEY `idx_statut` (`statut`);

--
-- Index pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_table_name` (`table_name`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `consultations`
--
ALTER TABLE `consultations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_medecin_id` (`medecin_id`),
  ADD KEY `idx_date_consultation` (`date_consultation`),
  ADD KEY `idx_appointment_id` (`appointment_id`);

--
-- Index pour la table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_consultation_id` (`consultation_id`);

--
-- Index pour la table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_facture` (`numero_facture`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_numero_facture` (`numero_facture`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_consultation_id` (`consultation_id`),
  ADD KEY `idx_statut_paiement` (`statut_paiement`),
  ADD KEY `idx_date_emission` (`date_emission`);

--
-- Index pour la table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_invoice_id` (`invoice_id`);

--
-- Index pour la table `medical_records`
--
ALTER TABLE `medical_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_patient_id` (`patient_id`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_dossier` (`numero_dossier`),
  ADD KEY `idx_numero_dossier` (`numero_dossier`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Index pour la table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recu_par` (`recu_par`),
  ADD KEY `idx_invoice_id` (`invoice_id`),
  ADD KEY `idx_date_paiement` (`date_paiement`);

--
-- Index pour la table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_ordonnance` (`numero_ordonnance`),
  ADD KEY `idx_numero_ordonnance` (`numero_ordonnance`),
  ADD KEY `idx_consultation_id` (`consultation_id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_medecin_id` (`medecin_id`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `fk_prescriptions_invoice` (`invoice_id`);

--
-- Index pour la table `prescription_medications`
--
ALTER TABLE `prescription_medications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_prescription_id` (`prescription_id`);

--
-- Index pour la table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cle` (`cle`),
  ADD KEY `idx_cle` (`cle`),
  ADD KEY `idx_groupe` (`groupe`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `idx_reset_password_token` (`reset_password_token`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `consultations`
--
ALTER TABLE `consultations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `medical_records`
--
ALTER TABLE `medical_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `prescriptions`
--
ALTER TABLE `prescriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `prescription_medications`
--
ALTER TABLE `prescription_medications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`medecin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`annule_par`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `consultations`
--
ALTER TABLE `consultations`
  ADD CONSTRAINT `consultations_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `consultations_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `consultations_ibfk_3` FOREIGN KEY (`medecin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `documents_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `medical_records`
--
ALTER TABLE `medical_records`
  ADD CONSTRAINT `medical_records_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`recu_par`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD CONSTRAINT `fk_prescriptions_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `prescriptions_ibfk_1` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `prescriptions_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `prescriptions_ibfk_3` FOREIGN KEY (`medecin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `prescription_medications`
--
ALTER TABLE `prescription_medications`
  ADD CONSTRAINT `prescription_medications_ibfk_1` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

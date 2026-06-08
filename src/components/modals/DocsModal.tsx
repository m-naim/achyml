import React from "react";
import { X, Book, FolderGit, Layout, GitFork, Keyboard } from "lucide-react";

export default function DocsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .docs-modal-container::-webkit-scrollbar {
          width: 8px;
        }
        .docs-modal-container::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 4px;
        }
        .docs-modal-container::-webkit-scrollbar-thumb {
          background: rgba(144, 202, 249, 0.25);
          border-radius: 4px;
        }
        .docs-modal-container::-webkit-scrollbar-thumb:hover {
          background: rgba(144, 202, 249, 0.45);
        }
      `}</style>
      <div
        className="docs-modal-container"
        style={{
          background: "rgba(30, 41, 59, 0.95)",
          border: "1px solid rgba(144, 202, 249, 0.2)",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "800px",
          maxHeight: "85vh",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(25, 118, 210, 0.2)",
          padding: "24px",
          color: "#e3f2fd",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflowY: "auto",
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          boxSizing: "border-box"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(144, 202, 249, 0.15)", paddingBottom: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Book size={24} style={{ color: "#90caf9" }} />
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#fff" }}>Guide d'Utilisation & Documentation</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#90caf9",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(144, 202, 249, 0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Section 1: Folder Sync & Bundle */}
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 8px 0", fontSize: "16px", color: "#fff" }}>
              <FolderGit size={18} style={{ color: "#90caf9" }} />
              1. Synchronisation & Assemblage de Dossier Local
            </h3>
            <p style={{ margin: "0 0 10px 0", fontSize: "13.5px", lineHeight: "1.6", color: "#cbd5e1" }}>
              L'application intègre l'API <b>File System Access</b>, ce qui vous permet d'organiser votre architecture de manière modulaire (chaque microservice/composant dans son propre fichier) et de laisser le navigateur assembler le tout en temps réel.
            </p>
            <ol style={{ margin: "0 0 12px 18px", padding: 0, fontSize: "13px", lineHeight: "1.6", color: "#cbd5e1" }}>
              <li>Cliquez sur <b>"Choose Folder"</b> dans le panneau de gauche et sélectionnez votre dossier de travail contenant vos fichiers YAML ou JSON.</li>
              <li>Dans le menu déroulant, sélectionnez votre fichier d'entrée principal (ex: <code>main.yaml</code>).</li>
              <li>Le navigateur scanne et <b>assemble (bundle) automatiquement</b> tous les autres fichiers composants trouvés dans le dossier pour reconstruire le schéma.</li>
              <li>Activez la case <b>"Live Sync"</b> : dès que vous sauvegardez une modification sur n'importe quel fichier de ce dossier dans VS Code ou autre éditeur, le navigateur met à jour le schéma instantanément sans recharger la page.</li>
            </ol>
          </div>

          {/* Section 2: YAML Schema Structure */}
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 8px 0", fontSize: "16px", color: "#fff" }}>
              <Layout size={18} style={{ color: "#90caf9" }} />
              2. Structure d'un Fichier YAML
            </h3>
            <p style={{ margin: "0 0 10px 0", fontSize: "13.5px", lineHeight: "1.6", color: "#cbd5e1" }}>
              Voici la structure typique attendue pour le fichier d'entrée (Main) ou un fichier de composant :
            </p>
            <pre style={{
              background: "#0f172a",
              border: "1px solid rgba(144, 202, 249, 0.15)",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "12px",
              fontFamily: "monospace",
              color: "#e2e8f0",
              margin: 0,
              overflowX: "auto"
            }}>
{`version: 1
components:
  - id: svc-auth
    type: microservice     # Gateway, microservice, sql, mongodb, queue, cache...
    name: auth-service
    level: 1               # Étage vertical (1 = haut, 2 = milieu, etc.)
    column: 1              # Alignement horizontal de gauche à droite
    elements:
      - id: route-login
        type: route        # route, table, collection...
        method: POST
        path: /login
links:                     # Optionnel (définit les relations globales)
  - id: link-auth-db
    from: route-login
    to: collection-users
    label: writes`}
            </pre>
          </div>

          {/* Section 3: Links and dependencies rules */}
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 8px 0", fontSize: "16px", color: "#fff" }}>
              <GitFork size={18} style={{ color: "#90caf9" }} />
              3. Règles des Liens & Relations
            </h3>
            <ul style={{ margin: "0 0 0 18px", padding: 0, fontSize: "13px", lineHeight: "1.6", color: "#cbd5e1" }}>
              <li style={{ marginBottom: "8px" }}>
                <b>Liaisons fines (élément à élément) :</b> Les relations (`links`) doivent idéalement référencer des identifiants d'éléments internes (ex: <code>route-login</code> ou <code>collection-users</code>).
              </li>
              <li style={{ marginBottom: "8px" }}>
                <b>Résolution automatique :</b> Si le point d'entrée (<code>from</code>) ou de sortie (<code>to</code>) d'un lien référence l'identifiant d'un composant global (ex: <code>svc-auth</code>), le parser le liera automatiquement au <b>premier élément interne</b> de ce composant.
              </li>
              <li>
                <b>Courbes fluides :</b> L'affichage oriente automatiquement les liaisons. Les flèches de gauche à droite ou de droite à gauche (dépendances arrières) se connectent élégamment sur les bords de composants sans traverser le contenu.
              </li>
            </ul>
          </div>

          {/* Section 4: Keyboard Shortcuts */}
          <div style={{ borderTop: "1px solid rgba(144, 202, 249, 0.15)", paddingTop: "16px" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 10px 0", fontSize: "15px", color: "#fff" }}>
              <Keyboard size={18} style={{ color: "#90caf9" }} />
              Raccourcis Clavier Utiles
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                <kbd style={{ background: "#1e293b", padding: "2px 6px", borderRadius: "4px", border: "1px solid #475569", fontFamily: "monospace" }}>A</kbd>
                <span style={{ color: "#94a3b8" }}>Ajouter un composant</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                <kbd style={{ background: "#1e293b", padding: "2px 6px", borderRadius: "4px", border: "1px solid #475569", fontFamily: "monospace" }}>P</kbd>
                <span style={{ color: "#94a3b8" }}>Masquer/Afficher les éléments (Parents seulement)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                <kbd style={{ background: "#1e293b", padding: "2px 6px", borderRadius: "4px", border: "1px solid #475569", fontFamily: "monospace" }}>C</kbd>
                <span style={{ color: "#94a3b8" }}>Activer le filtre de chaîne (Focus sur l'élément sélectionné)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                <kbd style={{ background: "#1e293b", padding: "2px 6px", borderRadius: "4px", border: "1px solid #475569", fontFamily: "monospace" }}>Esc</kbd>
                <span style={{ color: "#94a3b8" }}>Désélectionner l'élément courant</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

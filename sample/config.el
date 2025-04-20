;;; $DOOMDIR/config.el -*- lexical-binding: t; -*-

(defun mf-projectile-search-other-notes ()
  (default/search-project 'other))

;; ; Would be nice if this worked, but seems like getting the DoomEmacs search functionality with multiple directories combined is difficult to do
;; (defun mf-projectile-search-notes ()
;;   "Search across personal and work Org notes if in either directory.
;; Otherwise, fallback to `+default/search-project'."
;;   (interactive)
;;   (if (or (string-prefix-p (expand-file-name mf-notes-dir-p) (expand-file-name default-directory))
;;           (string-prefix-p (expand-file-name mf-notes-dir) (expand-file-name default-directory)))
;;       (let ((search-dirs (list (expand-file-name mf-notes-dir-p)
;;                                (expand-file-name mf-notes-dir))))
;;         (projectile-ripgrep nil (string-join search-dirs " ")))
;;     (call-interactively #'+default/search-project)))

;; For org =d6f3aed7b1b01df7b092a47099205847b34fdd37=, links are not displayed in echo area when moving point to them. Not working in doom, not working in spacemacs.
;; (setq help-at-pt-display-when-idle t) ;; To show links under point in org-mode: https://emacs.stackexchange.com/a/54357/33516
;; (setq help-at-pt-timer 1) ;; Experimenting with the timer - so far no result

;;
;;; Visuals

;; From https://github.com/d12frosted/homebrew-emacs-plus#emacs-29-and-emacs-30 to make rounded corners and no title
(add-to-list 'default-frame-alist '(undecorated-round . t))

(setq doom-font (font-spec :family "Iosevka" :size 17 :weight 'semi-light)
      doom-variable-pitch-font (font-spec :family "Iosevka Aile" :size 17))

(setq doom-themes-enable-bold nil) ;; TODO: tweak this less globally

;;
;;; Autocomplete

(setq company-idle-delay 2)
(setq completion-styles '(orderless))



;;
;;; MacOS - Native shortcuts, clipboard

;; Everything that's needed to separate clipboard and yanking/registers for Mac.

(use-package! simpleclip
  :config
  (simpleclip-mode 1)) ;; TODO: Consider using "load!"

;; Attempts at improving company-ispell lag
;; (defun mf-disable-company-time-based-completion ()
;;   (setq company-idle-delay nil))
;; (setq company-async-timeout 0)
;; (setq company-async-wait 0))

(setq doom-localleader-key "\\")
(setq doom-localleader-alt-key "C-\\")

(defun mf-split-window-right-and-focus ()
  "Split the window right and focus on the new window."
  (interactive)
  (select-window (split-window-right)))

(defun mf-split-window-below-and-focus ()
  "Split the window below and focus on the new window."
  (interactive)
  (select-window (split-window-below)))

;; Fix =fn-M-backspace= (read as =M-delete=) on MacOS:
(global-set-key (kbd "M-<delete>") 'sp-delete-word)
;; Fold open with all grandchildren (https://www.gnu.org/software/emacs/manual/html_node/emacs/Foldout.html)
(global-set-key (kbd "C-S-<tab>") (cmd!! #'outline-show-children 9))
(global-set-key (kbd "C-t") #'org-set-tags-command)
(global-set-key (kbd "C-,") #'other-window)
(global-set-key (kbd "s-]") #'next-buffer)
(global-set-key (kbd "s-[") #'previous-buffer)
(global-set-key (kbd "M-s-2") #'mf-split-window-right-and-focus)
(global-set-key (kbd "M-s-3") #'mf-split-window-below-and-focus)


(defun mf-message ()
  (interactive)
  (message "Press 1 to continue... ;)"))

(map! :leader
      :desc "Actions" :n "A" #'embark-act ;; Re-binding the override
      :desc "Agenda" :n "a" #'org-agenda
      :desc "Outdated" :n "j" 'mf-message
      :desc "Outdated" :n "J" 'mf-message
      :desc "Search project" :n "/" 'mf-projectile-search-other-notes
      :desc "M-x" :n "SPC" 'execute-extended-command)

(map!
 :desc "org-capture" "M-SPC" 'org-capture
 ;; :desc "Capture" :g "M-SPC" 'org-capture ;; TODO: Fix this not working in insert mode
 :desc "kill-current-buffer" "s-w" 'kill-current-buffer
 :desc "delete-window" "s-W" 'delete-window
 :desc "mf-save-all" "s-s" 'mf-save-all
 :desc "+default/search-project" "s-F" '+default/search-project
 ;; :desc "Search other notes" "C-s-f" 'mf-projectile-search-other-notes
 :desc "consult-buffer" "M-o" 'consult-buffer
 :desc "consult-org-agenda" "M-s-o" 'consult-org-agenda
 :desc "org-node-find" "s-o" #'org-node-find
 :desc "projectile-find-file" "C-s-o" 'projectile-find-file
 :desc "consult-yank-from-kill-ring" "M-v" #'consult-yank-from-kill-ring
 :desc "kill forward until EOL" :i "C-k" 'kill-line)


;;
;;; Notes

(setq mf-notes-dir-p "~/p/org/"
      mf-notes-dir "~/Library/Mobile Documents/iCloud~com~appsonthemove~beorg/Documents/org/")

(use-package! org-node
  :after org
  :config
  (org-node-cache-mode)
  (org-node-backlink-mode)
  (setq org-node-extra-id-dirs (list mf-notes-dir mf-notes-dir-p)
        org-node-alter-candidates t
        org-node-warn-title-collisions nil))

(use-package! org-id ;; TODO: May no longer be necessary
  :after org)

(defun mf-org-node-find-and-split-window ()
  "Split the window, then use `org-node-find` to
select and visit a node in the new window."
  (interactive)
  (let ((new-window (split-window-right)))
    (select-window new-window)
    (call-interactively 'org-node-find)))

;; Refactor from Denote to org-id:
(defun add-id-to-org-files (directory) ;; TODO: Move out into a file for rarely used functions
  "Add a unique :ID: property to each Org file in DIRECTORY that lacks one."
  (require 'org-id)
  (let ((org-id-track-globally t)
        (org-files (directory-files-recursively directory "\\.org$")))
    (dolist (file org-files)
      (with-current-buffer (find-file-noselect file)
        (goto-char (point-min))
        (unless (org-entry-get nil "ID" t)
          (let ((id (org-id-new)))
            (goto-char (point-min))
            (insert (format ":PROPERTIES:\n:ID:       %s\n:END:\n\n" id))
            (save-buffer))))
      (kill-buffer))))

(defun update-denote-links-across-org-files (directory) ;; TODO: Move out into a file for rarely used functions
  "Update Denote links to Org :ID: links across all Org files in DIRECTORY."
  (require 'org-id)
  (let ((org-id-track-globally t)
        (org-files (directory-files-recursively directory "\\.org$"))
        identifier-to-id)
    ;; First, build a mapping of #+identifier: to :ID: for all Org files
    (dolist (file org-files)
      (with-current-buffer (find-file-noselect file)
        (goto-char (point-min))
        (let (identifier id)
          (when (re-search-forward "^#\\+identifier: \\(.*\\)$" nil t)
            (setq identifier (match-string 1))
            (setq id (org-entry-get nil "ID" t))
            (when (and identifier id)
              (push (cons identifier id) identifier-to-id))))
        (kill-buffer)))
    ;; Then, update Denote links in all Org files
    (dolist (file org-files)
      (with-current-buffer (find-file-noselect file)
        (goto-char (point-min))
        (dolist (pair identifier-to-id)
          (let ((identifier (car pair))
                (id (cdr pair)))
            (goto-char (point-min))
            (while (re-search-forward (format "\\[\\[denote:%s" (regexp-quote identifier)) nil t)
              (replace-match (format "[[id:%s" id) t nil))))
        (save-buffer)
        (kill-buffer)))))

(setq org-extend-today-until 3) ;; For the late night journal entries that still "feel like today".
(setq org-directory mf-notes-dir)
;; (setq org-directory "~/p/org")
;; (setq org-journal-dir "~/Library/Mobile Documents/iCloud~com~appsonthemove~beorg/Documents/org/")
;; (setq org-journal-dir "~/p/org")
;; (setq org-journal-date-format "%Y-%m-%d %A")
;; (setq org-journal-enable-agenda-integration t)
;; (setq org-journal-file-type 'yearly)
;; (setq org-journal-follow-mode t)
;; (setq org-journal-hide-entries-p nil)
;; (setq org-journal-search-result-date-format "%Y-%m-%d %A")

(setq! ws-butler-global-exempt-modes '(special-mode comint-mode term-mode eshell-mode org-mode)) ;; Writing is thinking. Whitespace is breathing. Whitespace butler is great, but too constricting for org-mode.

;; TODO: Use add-to-list instead of "push", to avoid duplicates
(add-hook 'org-mode-hook
          (lambda () "Beautify Org Checkbox Symbol"
            ;; These are nice unicode characters for checkboxes: ☐ ☑ ☒
            ;; And some more from https://www.nerdfonts.com/cheat-sheet
            ;; 󰄲  󰡖  󰄮  󱋬
            ;;     
            ;; 󰄱  󰱒  󰅘
            ;; 󰱝  󰅗
            ;; 󰄵  󱋭
            ;; 󰀦  󱇎  󰀼  󰁦  󰃀  󰜺  󰅖  󰛉  󰡕  󰓒
            (push '("TODO" . "☐") prettify-symbols-alist)
            (push '("NEXT" . "Δ" ) prettify-symbols-alist)
            (push '("DONE" . "☑" ) prettify-symbols-alist)
            (push '("CANCELED" . "☒" ) prettify-symbols-alist)
            (push '("#+BEGIN_SRC" . "↦" ) prettify-symbols-alist)
            (push '("#+END_SRC" . "⇤" ) prettify-symbols-alist)
            (push '("#+BEGIN_EXAMPLE" . "↦" ) prettify-symbols-alist)
            (push '("#+END_EXAMPLE" . "⇤" ) prettify-symbols-alist)
            (push '("#+BEGIN_QUOTE" . "↦" ) prettify-symbols-alist)
            (push '("#+END_QUOTE" . "⇤" ) prettify-symbols-alist)
            (push '("#+begin_quote" . "↦" ) prettify-symbols-alist)
            (push '("#+end_quote" . "⇤" ) prettify-symbols-alist)
            (push '("#+begin_example" . "↦" ) prettify-symbols-alist)
            (push '("#+end_example" . "⇤" ) prettify-symbols-alist)
            (push '("#+begin_src" . "↦" ) prettify-symbols-alist)
            (push '("#+end_src" . "⇤" ) prettify-symbols-alist)

            ;; Not working as of 2021-11-01
            ;; (push '("+ [ ]" . "☐") prettify-symbols-alist)
            ;; (push '("+ [x]" . "☑" ) prettify-symbols-alist)
            ;; (push '("+ []" . "☒" ) prettify-symbols-alist)
            (prettify-symbols-mode)))


(defun mf-org-hide-properties-in-capture ()
  "Hide properties in the captured entry after `org-capture`."
  (when-let ((buffer (org-capture-get :buffer)))
    (with-current-buffer buffer
      (save-excursion
        (goto-char (point-min))
        ;; Ensure we are inside an Org buffer and at a heading
        (when (and (eq major-mode 'org-mode) (org-at-heading-p))
          ;; Fold property drawers
          (org-cycle-hide-drawers 'all))))))

(defun mf-org-capture-nodeify-datetree-day ()
  "Nodeify the day heading of a datetree entry during org-capture."
  (let ((marker (or (org-capture-get :exact-position)
                    (save-excursion (goto-char (point-max)) (point-marker))))
        (buffer (org-capture-get :buffer)))
    (if (not buffer)
        (message "mf-org-capture-nodeify-datetree-day: No buffer found")
      (with-current-buffer buffer
        (goto-char marker)
        (while (and (org-up-heading-safe)
                    (not (looking-at-p "^[*]+ \\([0-9]+\\(-[0-9]+\\)*\\)")))
          (ignore))
        (if (looking-at-p "^[*]+ \\([0-9]+\\(-[0-9]+\\)*\\)")
            (org-node-nodeify-entry)
          (message "mf-org-capture-nodeify-datetree-day: No day heading found to nodeify"))))))

(add-hook 'org-capture-after-finalize-hook #'mf-org-hide-properties-in-capture)
(add-hook 'org-capture-after-finalize-hook #'mf-org-capture-nodeify-datetree-day)

(defun mf-org-capture-time-only ()
  "Return the actual time (hour and minute) for journal entries.
If the current time is past midnight but within `org-extend-today-until`, adjust
the entry logically to align with the previous day."
  (let* ((hour (string-to-number (format-time-string "%H")))
         (minute (string-to-number (format-time-string "%M")))
         (current-time (+ (* hour 60) minute)))
    (if (< current-time (* 60 org-extend-today-until))
        (format-time-string "%H:%M" (time-subtract (current-time) (seconds-to-time 86400)))
      (format-time-string "%H:%M"))))

(defun mf-set-tag-and-property () ;; TODO: Broken after reducing to 1 choice
  "Apply a tag and set a property for the current org-mode heading."
  (interactive)
  (let* ((choices '(("AI Chat Link" . (:tag "ai" :property "ai_chat_link"))
                    ;; ("Related Heading" . (:property "related")))
                    )
                  (choice (completing-read "Choose tag and property type: " (mapcar #'car choices)))
                  (tag (plist-get (cdr (assoc choice choices)) :tag))
                  (property (plist-get (cdr (assoc choice choices)) :property))
                  ;; (value (if (string= choice "Related Heading")
                  ;;            (mf-get-org-link-to-heading)
                  ;;          (substring-no-properties (or (gui-get-selection 'CLIPBOARD)
                  ;;                                       (error "Clipboard is empty"))))
                  ))
    ;; Add tag only if specified
    (when tag
      (org-toggle-tag tag 'on))
    ;; Set property
    (org-entry-put (point) property value)
    (message "Set property %s to %s%s"
             property
             value
             (if tag (format " and added tag :%s:" tag) ""))))

(defun mf-org-capture-assign-id ()
  "Insert a unique ID into the properties drawer of the captured entry."
  (org-id-get-create))


(after! org
  (map! :map org-mode-map
        :desc "Set tags" :n "C-t" #'org-set-tags-command
        :desc "Fold drawers" :ni "C-<tab>" 'org-fold-hide-drawer-all
        :desc "Open org-node to the right" :g "s-O" #'mf-org-node-find-and-split-window
        :desc "Other window" :g "C-," #'other-window
        :desc "Nodeify org-node entry" :g "s-N" #'org-node-nodeify-entry
        :desc "Insert org-node link" :g "s-n" #'org-node-insert-link
        :desc "Insert org-node link" :g "s-i" #'org-node-insert-link
        ;; :desc "Insert org-node heading" :g "C-s-N" #'org-node-insert-heading
        ;; :desc "Insert org-node transclusion" :g "C-M-s-n" #'org-node-insert-transclusion
        :desc "Insert org-node transclusion subtree" :g "C-s-n" #'org-node-insert-transclusion-as-subtree
        :localleader
        :desc "Schedule today" :n "D" (cmd!! #'org-schedule 0 "+2d")
        :desc "Cancel todo" :n "C" (cmd!! #'org-todo "CANCELED")
        :desc "Columns mode" :n "m" #'org-columns
        :desc "Set tag and property" "x" #'mf-set-tag-and-property ;; swap for org-toggle-checkbox
        :desc "Toggle checkbox" "X" 'org-toggle-checkbox)

  (setq org-ellipsis " ▼ ")
  (setq org-agenda-files (list "inbox.org" "todo.org" ))
  (setq org-todo-keywords
        '((sequence "TODO(t!)" "NEXT(n!)" "WAIT(w@/!)" "|" "DONE(d!)" "CANCELED(c@/!)")))
  (setq org-log-state-notes-into-drawer t)
  (setq org-log-refile (quote time))
  (setq org-hide-block-startup t) ;; TODO: Does not get set properly - perhaps needs to be after org? Or it may need to be used in its alias form `org-cycle-hide-block-startup`?

  (org-link-set-parameters "id" :complete 'mf-org-id-complete-link)

  (setq mf-org-capture-target-journal-p "~/p/org/pj.org")
  (setq mf-org-capture-target-journal "~/Library/Mobile Documents/iCloud~com~appsonthemove~beorg/Documents/org/journal.org")
  ;; (setq mf-org-capture-target-journal-personal "~/Library/Mobile Documents/iCloud~com~appsonthemove~beorg/Documents/org/20241108T000000--journal__self.org")

  (defun mf-org-capture-adjust-point ()
    "Switch to insert mode and move the point to the end of the line,
simulating `C-e`."
    (evil-insert-state)
    (end-of-line))

  (setq org-capture-templates
        `(
          ("t" "Todo" entry
           (file+headline "~/Library/Mobile Documents/iCloud~com~appsonthemove~beorg/Documents/org/inbox.org" "New")
           ,(concat "** TODO %?\n"
                    ":PROPERTIES:\n"
                    ":ID:       \n"
                    ":CREATED:  %U\n"
                    ":from:     %a\n"
                    ":END:\n\n")
           :jump-to-captured t
           ;; :immediate-finish t
           :empty-lines-after 1
           :hook mf-org-capture-assign-id)
          ;; :after-finalize mf-org-capture-adjust-point)

          ("T" "Todo (p)" entry
           (file+headline "~/p/org/pi.org" "New")
           ,(concat "** TODO %?\n"
                    ":PROPERTIES:\n"
                    ":ID:       \n"
                    ":CREATED:  %U\n"
                    ":from:     %a\n"
                    ":END:\n\n")
           :jump-to-captured t
           ;; :immediate-finish t
           :empty-lines-after 1
           :hook mf-org-capture-assign-id)
          ;; :after-finalize mf-org-capture-adjust-point)



          ;; Regular journal entries with nothing extra - akin to org-journal style
          ("j" "Journal" entry
           (file+olp+datetree mf-org-capture-target-journal)
           "* %(mf-org-capture-time-only) %?\nTimeBack: \nAnchor: "
           ;; :immediate-finish t
           :jump-to-captured t)
          ;; :after-finalize mf-org-capture-adjust-point)
          ("J" "Journal (p)" entry
           (file+olp+datetree mf-org-capture-target-journal-p)
           "* %(mf-org-capture-time-only) %?"
           ;; :immediate-finish t
           :jump-to-captured t)
          ;; :after-finalize mf-org-capture-adjust-point)
          ("	" "Journal (p)" entry
           (file+olp+datetree mf-org-capture-target-journal-p)
           "* %(mf-org-capture-time-only) %?"
           ;; :immediate-finish t
           :jump-to-captured t)
          ;; :after-finalize mf-org-capture-adjust-point)

          ;; Decision entries, tagged as decision and with properties prepared
          ("d" "Decision" entry
           (file+olp+datetree mf-org-capture-target-journal)
           ,(concat "* %(mf-org-capture-time-only) %? :decision:\n"
                    ":PROPERTIES:\n"
                    ":ID:       \n"
                    ":CREATED:  %U\n"
                    ":from:     %a\n"
                    ":END:\n\n")
           :jump-to-captured t
           ;; :immediate-finish t
           :empty-lines-after 1
           :hook mf-org-capture-assign-id)
          ;; :after-finalize mf-org-capture-adjust-point)



          ("D" "Decision (p)" entry
           (file+olp+datetree mf-org-capture-target-journal-p)
           ,(concat "* %(mf-org-capture-time-only) %? :decision:\n"
                    ":PROPERTIES:\n"
                    ":ID:       \n"
                    ":CREATED:  %U\n"
                    ":from:     %a\n"
                    ":END:\n\n")
           :jump-to-captured t
           ;; :immediate-finish t
           :empty-lines-after 1
           :hook mf-org-capture-assign-id)
          ;; :after-finalize mf-org-capture-adjust-point)



          ;; Intent entries, tagged as intent and with properties prepared
          ("i" "Intent" entry
           (file+olp+datetree mf-org-capture-target-journal)
           ,(concat "* %(mf-org-capture-time-only) %? :intent:\n"
                    ":PROPERTIES:\n"
                    ":ID:       \n"
                    ":CREATED:  %U\n"
                    ":from:     %a\n"
                    ":END:\n\n")
           :jump-to-captured t
           ;; :immediate-finish t
           :empty-lines-after 1
           :hook mf-org-capture-assign-id)
          ;; :after-finalize mf-org-capture-adjust-point)


          ("I" "Intent (p)" entry
           (file+olp+datetree mf-org-capture-target-journal-p)
           ,(concat "* %(mf-org-capture-time-only) %? :intent:\n"
                    ":PROPERTIES:\n"
                    ":ID:       \n"
                    ":CREATED:  %U\n"
                    ":from:     %a\n"
                    ":END:\n\n")
           :jump-to-captured t
           ;; :immediate-finish t
           :empty-lines-after 1
           :hook mf-org-capture-assign-id)
          ;; :after-finalize mf-org-capture-adjust-point)


          ;; Recap entries, tagged as recap and with properties prepared
          ("r" "Recap" entry
           (file+olp+datetree mf-org-capture-target-journal)
           ,(concat "* %(mf-org-capture-time-only) %? :recap:\n"
                    ":PROPERTIES:\n"
                    ":ID:       \n"
                    ":CREATED:  %U\n"
                    ":from:     %a\n"
                    ":END:\n\n")
           :jump-to-captured t
           ;; :immediate-finish t
           :empty-lines-after 1
           :hook mf-org-capture-assign-id)
          ;; :after-finalize mf-org-capture-adjust-point)


          ("R" "Recap (p)" entry
           (file+olp+datetree mf-org-capture-target-p)
           ,(concat "* %(mf-org-capture-time-only) %? :recap:\n"
                    ":PROPERTIES:\n"
                    ":ID:       \n"
                    ":CREATED:  %U\n"
                    ":from:     %a\n"
                    ":END:\n\n")
           :jump-to-captured t
           ;; :immediate-finish t
           :empty-lines-after 1
           ;; :after-finalize mf-org-capture-adjust-point)
           :hook mf-org-capture-assign-id))))

;; Show clocking status as an icon in the MacOS menu bar application https://github.com/koddo/org-clock-statusbar-app
(add-hook 'org-clock-in-hook (lambda () (call-process "/usr/bin/osascript" nil 0 nil "-e" (concat "tell application \"org-clock-statusbar\" to clock in \"" (replace-regexp-in-string "\"" "\\\\\"" org-clock-current-task) "\""))))
(add-hook 'org-clock-out-hook (lambda () (call-process "/usr/bin/osascript" nil 0 nil "-e" "tell application \"org-clock-statusbar\" to clock out")))

(defun mf-minibuffer-timestamp-bindings ()
  "Add timestamp shortcuts to the minibuffer."
  (local-set-key (kbd "C-c .") #'org-time-stamp)
  (local-set-key (kbd "C-c t") #'org-time-stamp-inactive)
  (local-set-key (kbd "C-c !") (lambda () (interactive) (org-time-stamp t))))

(add-hook 'minibuffer-setup-hook #'mf-minibuffer-timestamp-bindings)

;; Is this necessary for external org-capture?
;; (defun mf-external-capture-handler ()
;;   "Handles external captures by ensuring the correct journal file is targeted."
;;   (let ((org-capture-templates org-capture-templates))
;;     (org-capture)))
;; (global-set-key (kbd "C-c x") #'mf-external-capture-handler)

;;; Movement

(setq save-place-mode t)

;;
;; Text objects in org-mode for working with ~this~ and =this= type of highlights: https://stackoverflow.com/a/22418983/4921402 + https://github.com/emacs-evil/evil-surround#add-new-surround-pairs-through-creation-of-evil-objects
(defmacro define-and-bind-quoted-text-object (name key start-regex end-regex)
  (let ((inner-name (make-symbol (concat "evil-inner-" name)))
        (outer-name (make-symbol (concat "evil-a-" name))))
    `(progn
       (evil-define-text-object ,inner-name (count &optional beg end type)
         (evil-select-paren ,start-regex ,end-regex beg end type count nil))
       (evil-define-text-object ,outer-name (count &optional beg end type)
         (evil-select-paren ,start-regex ,end-regex beg end type count t))
       (define-key evil-inner-text-objects-map ,key #',inner-name)
       (define-key evil-outer-text-objects-map ,key #',outer-name))))

(define-and-bind-quoted-text-object "tilde" "~" "~" "~")
(define-and-bind-quoted-text-object "equals" "=" "=" "=")

(use-package! evil
  :custom evil-disable-insert-state-bindings t)

;;
;;; Saving

;; A clean "save everything" https://stackoverflow.com/a/20137832/1108174
(defun mf-save-all () (interactive) (save-some-buffers t))

;; Auto saves without asking on focus loss
(add-hook! 'focus-out-hook 'mf-save-all)

;; How to make aliases/alternative functions with universal argument:
(fset 'org-reset-global-visibility (cmd!! #'org-global-cycle '(4)))
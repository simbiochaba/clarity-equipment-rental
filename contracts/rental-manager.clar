;; Equipment Rental Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-already-rented (err u101))
(define-constant err-not-rented (err u102))
(define-constant err-insufficient-deposit (err u103))
(define-constant err-not-renter (err u104))

;; Data vars
(define-map equipment-rentals
    { equipment-id: uint }
    {
        renter: principal,
        deposit: uint,
        rental-start: uint
    }
)

(define-map equipment-details
    { equipment-id: uint }
    {
        name: (string-ascii 50),
        deposit-required: uint,
        daily-rate: uint
    }
)

;; Add new equipment - owner only
(define-public (add-equipment (equipment-id uint) (name (string-ascii 50)) (deposit uint) (daily-rate uint))
    (if (is-eq tx-sender contract-owner)
        (ok (map-set equipment-details { equipment-id: equipment-id }
            {
                name: name,
                deposit-required: deposit,
                daily-rate: daily-rate
            }))
        err-owner-only
    )
)

;; Rent equipment
(define-public (rent-equipment (equipment-id uint))
    (let (
        (equipment (unwrap! (map-get? equipment-details { equipment-id: equipment-id }) (err u404)))
        (current-rental (map-get? equipment-rentals { equipment-id: equipment-id }))
    )
    (asserts! (is-none current-rental) err-already-rented)
    (asserts! (>= (stx-get-balance tx-sender) (get deposit-required equipment)) err-insufficient-deposit)
    
    (try! (stx-transfer? (get deposit-required equipment) tx-sender contract-owner))
    
    (ok (map-set equipment-rentals { equipment-id: equipment-id }
        {
            renter: tx-sender,
            deposit: (get deposit-required equipment),
            rental-start: block-height
        }))
    )
)

;; Return equipment
(define-public (return-equipment (equipment-id uint))
    (let (
        (rental (unwrap! (map-get? equipment-rentals { equipment-id: equipment-id }) err-not-rented))
    )
    (asserts! (is-eq tx-sender (get renter rental)) err-not-renter)
    
    (try! (stx-transfer? (get deposit rental) contract-owner tx-sender))
    (ok (map-delete equipment-rentals { equipment-id: equipment-id }))
    )
)

;; Read only functions
(define-read-only (get-equipment-details (equipment-id uint))
    (ok (map-get? equipment-details { equipment-id: equipment-id }))
)

(define-read-only (get-rental-status (equipment-id uint))
    (ok (map-get? equipment-rentals { equipment-id: equipment-id }))
)

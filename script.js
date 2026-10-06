// ======================================================
// SUPABASE CONNECTION
// ======================================================

const SUPABASE_URL = "https://ynqxjcugrdsogwrkhgor.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_4W0EBlrR4djDQ5QXTFtLkg_esHU8L_-";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ======================================================
// ADMIN LOGIN & SESSION
// ======================================================

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const adminLoginBox = document.getElementById("adminLoginBox");
const adminStatusBox = document.getElementById("adminStatusBox");
const adminStatusMessage = document.getElementById("adminStatusMessage");
const logoutButton = document.getElementById("logoutButton");

// Admin-only borrower form
const adminBorrowerForm =
    document.getElementById("adminBorrowerForm");

// Tracks whether an admin is currently logged in
let isAdminLoggedIn = false;


// ======================================================
// CHECK CURRENT LOGIN SESSION
// ======================================================

async function checkAdminSession() {

    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error) {

        console.error(
            "Session check error:",
            error
        );

        return;
    }

    updateAdminInterface(data.session);
}


// ======================================================
// UPDATE ADMIN INTERFACE
// ======================================================

function updateAdminInterface(session) {

    isAdminLoggedIn = !!session;


    if (session) {

        // ==============================================
        // ADMIN IS LOGGED IN
        // ==============================================

        adminLoginBox.style.display = "none";

        adminStatusBox.style.display = "block";

        adminStatusMessage.textContent =
            "You are logged in as administrator.";


        // Show borrower form
        if (adminBorrowerForm) {

            adminBorrowerForm.style.display =
                "block";
        }

    } else {

        // ==============================================
        // PUBLIC VISITOR
        // ==============================================

        adminLoginBox.style.display =
            "block";

        adminStatusBox.style.display =
            "none";


        // Hide borrower form
        if (adminBorrowerForm) {

            adminBorrowerForm.style.display =
                "none";
        }
    }


    // Re-render the loan table so the
    // penalty column changes immediately
    if (
        typeof renderLoans === "function" &&
        loans.length > 0
    ) {

        renderLoans();
    }


    // Re-render repayment history if
    // a repayment modal is currently open
    if (
        typeof updateRepaymentModal === "function" &&
        selectedLoanId !== null
    ) {

        updateRepaymentModal();
    }
}


// ======================================================
// LOGIN
// ======================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("loginPassword")
                    .value;


            loginMessage.textContent =
                "Logging in...";


            const { data, error } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password
                });


            if (error) {

                console.error(error);

                loginMessage.textContent =
                    error.message;

                return;
            }


            console.log(
                "Login successful:",
                data
            );


            loginMessage.textContent =
                "Login successful.";


            updateAdminInterface(
                data.session
            );
        }
    );
}


// ======================================================
// LOGOUT
// ======================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            const { error } =
                await supabaseClient.auth.signOut();


            if (error) {

                console.error(error);

                alert(
                    "Logout failed: " +
                    error.message
                );

                return;
            }


            updateAdminInterface(null);


            alert(
                "You have been logged out."
            );
        }
    );
}


// ======================================================
// AUTOMATIC AUTH STATE CHANGES
// ======================================================

supabaseClient.auth.onAuthStateChange(
    function (event, session) {

        console.log(
            "Auth event:",
            event
        );


        updateAdminInterface(
            session
        );
    }
);


// Check session when page loads
checkAdminSession();



// ======================================================
// APPLICATION STATE
// ======================================================

let loans = [];

let editingLoanId = null;

let selectedLoanId = null;



// ======================================================
// GET ELEMENTS
// ======================================================

const loanForm =
    document.getElementById("loanForm");

const formTitle =
    document.getElementById("formTitle");

const borrowerName =
    document.getElementById("borrowerName");

const guarantor1 =
    document.getElementById("guarantor1");

const guarantor2 =
    document.getElementById("guarantor2");

const loanAmount =
    document.getElementById("loanAmount");

const repayAmount =
    document.getElementById("repayAmount");

const saveButton =
    document.getElementById("saveButton");

const cancelButton =
    document.getElementById("cancelButton");

const searchInput =
    document.getElementById("searchInput");

const loanTableBody =
    document.getElementById("loanTableBody");

const emptyMessage =
    document.getElementById("emptyMessage");

const totalBorrowers =
    document.getElementById("totalBorrowers");

const totalLoans =
    document.getElementById("totalLoans");

const totalRepaid =
    document.getElementById("totalRepaid");

const totalOutstanding =
    document.getElementById("totalOutstanding");

const repaymentModal =
    document.getElementById("repaymentModal");

const modalBorrowerName =
    document.getElementById("modalBorrowerName");

const modalLoanAmount =
    document.getElementById("modalLoanAmount");

const modalRepayAmount =
    document.getElementById("modalRepayAmount");

const modalTotalPaid =
    document.getElementById("modalTotalPaid");

const modalTotalPenalty =
    document.getElementById("modalTotalPenalty");

const modalBalance =
    document.getElementById("modalBalance");

const repaymentForm =
    document.getElementById("repaymentForm");

const paymentDate =
    document.getElementById("paymentDate");

const paymentAmount =
    document.getElementById("paymentAmount");

const paymentPenalty =
    document.getElementById("paymentPenalty");

const paymentNote =
    document.getElementById("paymentNote");

const repaymentHistory =
    document.getElementById("repaymentHistory");



// ======================================================
// HELPER FUNCTIONS
// ======================================================

function formatMoney(amount) {

    return "₦" +
        Number(amount || 0).toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}


function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}



// ======================================================
// CONVERT SUPABASE LOAN INTO APP FORMAT
// ======================================================

function convertLoan(row) {

    return {

        id: row.id,

        borrower: row.borrower_name,

        guarantor1: row.guarantor1,

        guarantor2: row.guarantor2,

        loanAmount:
            Number(row.loan_amount || 0),

        repayAmount:
            Number(row.repay_amount || 0),

        repayments: [],

        createdAt:
            row.created_at
    };
}



// ======================================================
// LOAD REPAYMENTS
// ======================================================

async function loadRepayments() {

    const { data, error } =
        await supabaseClient
            .from("repayments")
            .select("*")
            .order(
                "payment_date",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error loading repayments:",
            error
        );


        alert(
            "Unable to load repayment records.\n\n" +
            error.message
        );


        return;
    }


    loans.forEach(
        function (loan) {

            loan.repayments = [];
        }
    );


    data.forEach(
        function (payment) {

            const loan =
                loans.find(
                    loanRecord =>
                        Number(loanRecord.id) ===
                        Number(payment.loan_id)
                );


            if (!loan) return;


            loan.repayments.push({

                id: payment.id,

                date: payment.payment_date,

                amount:
                    Number(
                        payment.payment_amount || 0
                    ),

                penalty:
                    Number(
                        payment.penalty || 0
                    ),

                note:
                    payment.note || ""
            });
        }
    );
}



// ======================================================
// LOAD LOANS
// ======================================================

async function loadLoans() {

    loanTableBody.innerHTML = `
        <tr>
            <td colspan="10"
                style="text-align:center; padding:20px;">
                Loading borrowers...
            </td>
        </tr>
    `;


    const { data, error } =
        await supabaseClient
            .from("loans")
            .select("*")
            .order(
                "id",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Error loading loans:",
            error
        );


        loanTableBody.innerHTML = "";


        alert(
            "Unable to load loan records.\n\n" +
            error.message
        );


        return;
    }


    loans =
        data.map(convertLoan);


    await loadRepayments();


    renderLoans();

    updateDashboard();
}



// ======================================================
// CALCULATE TOTAL PAID
// ======================================================

function getTotalPaid(loan) {

    if (!loan.repayments) return 0;


    return loan.repayments.reduce(
        function (total, payment) {

            return total +
                Number(payment.amount || 0);

        },
        0
    );
}



// ======================================================
// CALCULATE TOTAL PENALTY
// ======================================================

function getTotalPenalty(loan) {

    if (!loan.repayments) return 0;


    return loan.repayments.reduce(
        function (total, payment) {

            return total +
                Number(payment.penalty || 0);

        },
        0
    );
}



// ======================================================
// CALCULATE BALANCE
// ======================================================

function getBalance(loan) {

    const repay =
        Number(
            loan.repayAmount || 0
        );


    const paid =
        getTotalPaid(loan);


    const penalty =
        getTotalPenalty(loan);


    return Math.max(
        0,
        repay + penalty - paid
    );
}



// ======================================================
// ADD / UPDATE LOAN
// ======================================================

loanForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const borrower =
            borrowerName.value.trim();


        const g1 =
            guarantor1.value.trim();


        const g2 =
            guarantor2.value.trim();


        const loan =
            Number(
                loanAmount.value
            );


        const repay =
            Number(
                repayAmount.value
            );


        if (
            !borrower ||
            !g1 ||
            !g2
        ) {

            alert(
                "Please fill in all borrower and guarantor fields."
            );


            return;
        }


        if (
            loan <= 0 ||
            repay <= 0
        ) {

            alert(
                "Please enter valid loan and repayment amounts."
            );


            return;
        }


        saveButton.disabled = true;



        // ==============================================
        // UPDATE EXISTING LOAN
        // ==============================================

        if (editingLoanId !== null) {

            const { error } =
                await supabaseClient
                    .from("loans")
                    .update({

                        borrower_name:
                            borrower,

                        guarantor1:
                            g1,

                        guarantor2:
                            g2,

                        loan_amount:
                            loan,

                        repay_amount:
                            repay

                    })
                    .eq(
                        "id",
                        editingLoanId
                    );


            if (error) {

                console.error(
                    "Update loan error:",
                    error
                );


                alert(
                    "Unable to update borrower.\n\n" +
                    error.message
                );


                saveButton.disabled =
                    false;


                return;
            }


            alert(
                "Borrower updated successfully."
            );

        }


        // ==============================================
        // ADD NEW LOAN
        // ==============================================

        else {

            const { error } =
                await supabaseClient
                    .from("loans")
                    .insert({

                        borrower_name:
                            borrower,

                        guarantor1:
                            g1,

                        guarantor2:
                            g2,

                        loan_amount:
                            loan,

                        repay_amount:
                            repay

                    });


            if (error) {

                console.error(
                    "Insert loan error:",
                    error
                );


                alert(
                    "Unable to save borrower.\n\n" +
                    error.message
                );


                saveButton.disabled =
                    false;


                return;
            }


            alert(
                "Borrower saved successfully."
            );
        }


        saveButton.disabled =
            false;


        resetLoanForm();


        await loadLoans();
    }
);



// ======================================================
// RESET FORM
// ======================================================

function resetLoanForm() {

    loanForm.reset();


    editingLoanId = null;


    formTitle.textContent =
        "Add New Borrower";


    saveButton.textContent =
        "Save Borrower";


    cancelButton.style.display =
        "none";
}



// ======================================================
// CANCEL EDIT
// ======================================================

cancelButton.addEventListener(
    "click",
    function () {

        resetLoanForm();
    }
);



// ======================================================
// RENDER LOANS
// ======================================================

function renderLoans(data = loans) {

    loanTableBody.innerHTML = "";


    if (data.length === 0) {

        emptyMessage.style.display =
            "block";

        return;
    }


    emptyMessage.style.display =
        "none";


    data.forEach(
        function (loan, index) {

            const paid =
                getTotalPaid(loan);


            const penalty =
                getTotalPenalty(loan);


            const balance =
                getBalance(loan);


            const row =
                document.createElement("tr");


            // ==================================================
            // ADMIN TABLE
            // ==================================================

            if (isAdminLoggedIn) {

                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            loan.borrower
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            loan.guarantor1
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            loan.guarantor2
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            loan.loanAmount
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            loan.repayAmount
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            paid
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            penalty
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            balance
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="repayment-btn"
                            data-action="repayment"
                            data-id="${loan.id}">
                            Repayment
                        </button>

                        <button
                            type="button"
                            class="edit-btn"
                            data-action="edit"
                            data-id="${loan.id}">
                            Edit
                        </button>

                        <button
                            type="button"
                            class="delete-btn"
                            data-action="delete"
                            data-id="${loan.id}">
                            Delete
                        </button>

                    </td>
                `;

            }

            // ==================================================
            // PUBLIC TABLE
            // ==================================================

            else {

                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            loan.borrower
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            loan.guarantor1
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            loan.guarantor2
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            loan.loanAmount
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            loan.repayAmount
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            paid
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            balance
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="repayment-btn"
                            data-action="repayment"
                            data-id="${loan.id}">
                            Repayment
                        </button>

                    </td>
                `;
            }


            loanTableBody.appendChild(row);
        }
    );
}



// ======================================================
// TABLE BUTTON ACTIONS
// ======================================================

loanTableBody.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "button"
            );


        if (!button) return;


        const id =
            Number(
                button.dataset.id
            );


        const action =
            button.dataset.action;


        if (action === "repayment") {

            openRepayment(id);

        }

        else if (
            action === "edit"
        ) {

            // Extra frontend protection
            if (!isAdminLoggedIn) return;

            editLoan(id);

        }

        else if (
            action === "delete"
        ) {

            // Extra frontend protection
            if (!isAdminLoggedIn) return;

            deleteLoan(id);
        }
    }
);



// ======================================================
// EDIT LOAN
// ======================================================

function editLoan(id) {

    if (!isAdminLoggedIn) return;


    const loan =
        loans.find(
            loanRecord =>
                Number(loanRecord.id) ===
                Number(id)
        );


    if (!loan) {

        alert(
            "Borrower record not found."
        );


        return;
    }


    editingLoanId = id;


    borrowerName.value =
        loan.borrower;


    guarantor1.value =
        loan.guarantor1;


    guarantor2.value =
        loan.guarantor2;


    loanAmount.value =
        loan.loanAmount;


    repayAmount.value =
        loan.repayAmount;


    formTitle.textContent =
        "Edit Borrower";


    saveButton.textContent =
        "Update Borrower";


    cancelButton.style.display =
        "inline-block";


    window.scrollTo({

        top: 0,

        behavior: "smooth"
    });
}



// ======================================================
// DELETE LOAN
// ======================================================

async function deleteLoan(id) {

    if (!isAdminLoggedIn) return;


    const loan =
        loans.find(
            loanRecord =>
                Number(loanRecord.id) ===
                Number(id)
        );


    if (!loan) {

        alert(
            "Borrower record not found."
        );


        return;
    }


    const answer =
        confirm(
            `Are you sure you want to delete ${loan.borrower}?`
        );


    if (!answer) return;


    const { error } =
        await supabaseClient
            .from("loans")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Delete loan error:",
            error
        );


        alert(
            "Unable to delete borrower.\n\n" +
            error.message
        );


        return;
    }


    alert(
        "Borrower deleted successfully."
    );


    await loadLoans();
}



// ======================================================
// SEARCH
// ======================================================

searchInput.addEventListener(
    "input",
    function () {

        const search =
            searchInput.value
                .toLowerCase()
                .trim();


        const results =
            loans.filter(
                function (loan) {

                    return (

                        loan.borrower
                            .toLowerCase()
                            .includes(search)

                        ||

                        loan.guarantor1
                            .toLowerCase()
                            .includes(search)

                        ||

                        loan.guarantor2
                            .toLowerCase()
                            .includes(search)
                    );
                }
            );


        renderLoans(results);
    }
);



// ======================================================
// OPEN REPAYMENT
// ======================================================

function openRepayment(id) {

    const loan =
        loans.find(
            loanRecord =>
                Number(loanRecord.id) ===
                Number(id)
        );


    if (!loan) {

        alert(
            "Borrower record not found."
        );


        return;
    }


    selectedLoanId = id;


    modalBorrowerName.textContent =
        loan.borrower;


    modalLoanAmount.textContent =
        formatMoney(
            loan.loanAmount
        );


    modalRepayAmount.textContent =
        formatMoney(
            loan.repayAmount
        );


    updateRepaymentModal();


    repaymentModal.style.display =
        "flex";
}



// ======================================================
// UPDATE REPAYMENT MODAL
// ======================================================

function updateRepaymentModal() {

    const loan =
        loans.find(
            loanRecord =>
                Number(loanRecord.id) ===
                Number(selectedLoanId)
        );


    if (!loan) return;


    const paid =
        getTotalPaid(loan);


    const penalty =
        getTotalPenalty(loan);


    const balance =
        getBalance(loan);


    modalTotalPaid.textContent =
        formatMoney(paid);


    modalTotalPenalty.textContent =
        formatMoney(penalty);


    modalBalance.textContent =
        formatMoney(balance);


    // Hide penalty summary for public
    const penaltySummaryBox =
        modalTotalPenalty
            ? modalTotalPenalty.closest(
                ".summary-box"
            )
            : null;


    if (penaltySummaryBox) {

        penaltySummaryBox.style.display =
            isAdminLoggedIn
                ? ""
                : "none";
    }


    // Hide repayment penalty input for public
    const penaltyInputGroup =
        paymentPenalty
            ? paymentPenalty.closest(
                ".form-group"
            )
            : null;


    if (penaltyInputGroup) {

        penaltyInputGroup.style.display =
            isAdminLoggedIn
                ? ""
                : "none";
    }


    // Public visitors should not see
    // the repayment form at all.
    // Admin continues to manage repayments.
    if (repaymentForm) {

        repaymentForm.style.display =
            isAdminLoggedIn
                ? ""
                : "none";
    }


    displayRepaymentHistory(loan);
}



// ======================================================
// DISPLAY PAYMENT HISTORY
// ======================================================

function displayRepaymentHistory(loan) {

    repaymentHistory.innerHTML = "";


    if (
        !loan.repayments ||
        loan.repayments.length === 0
    ) {

        repaymentHistory.innerHTML = `

            <tr>

                <td
                    colspan="${isAdminLoggedIn ? 5 : 3}"
                    style="text-align:center; padding:20px;"
                >
                    No repayment recorded yet.
                </td>

            </tr>
        `;


        return;
    }


    loan.repayments.forEach(
        function (payment) {

            const row =
                document.createElement("tr");


            // ==================================================
            // ADMIN REPAYMENT HISTORY
            // ==================================================

            if (isAdminLoggedIn) {

                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            payment.date
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            payment.amount
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            payment.penalty
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            payment.note ||
                            "No note"
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="delete-btn repayment-delete-btn"
                            data-payment-id="${payment.id}">
                            Delete
                        </button>

                    </td>
                `;

            }

            // ==================================================
            // PUBLIC REPAYMENT HISTORY
            // ==================================================

            else {

                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            payment.date
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            payment.amount
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            payment.note ||
                            "No note"
                        )}
                    </td>
                `;
            }


            repaymentHistory.appendChild(row);
        }
    );
}



// ======================================================
// DELETE REPAYMENT
// ======================================================

repaymentHistory.addEventListener(
    "click",
    function (event) {

        if (!isAdminLoggedIn) return;


        const button =
            event.target.closest(
                ".repayment-delete-btn"
            );


        if (!button) return;


        const paymentId =
            Number(
                button.dataset.paymentId
            );


        deleteRepayment(
            paymentId
        );
    }
);



// ======================================================
// DELETE REPAYMENT FUNCTION
// ======================================================

async function deleteRepayment(
    paymentId
) {

    if (!isAdminLoggedIn) return;


    const answer =
        confirm(
            "Are you sure you want to delete this repayment?"
        );


    if (!answer) return;


    const { error } =
        await supabaseClient
            .from("repayments")
            .delete()
            .eq(
                "id",
                paymentId
            );


    if (error) {

        console.error(
            "Delete repayment error:",
            error
        );


        alert(
            "Unable to delete repayment.\n\n" +
            error.message
        );


        return;
    }


    await loadLoans();


    updateRepaymentModal();

    renderLoans();

    updateDashboard();


    alert(
        "Repayment deleted successfully."
    );
}



// ======================================================
// ADD REPAYMENT
// ======================================================

repaymentForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (!isAdminLoggedIn) {

            alert(
                "Administrator login is required."
            );

            return;
        }


        const loan =
            loans.find(
                loanRecord =>
                    Number(loanRecord.id) ===
                    Number(selectedLoanId)
            );


        if (!loan) {

            alert(
                "Borrower record not found."
            );


            return;
        }


        const date =
            paymentDate.value;


        const amount =
            Number(
                paymentAmount.value || 0
            );


        const penalty =
            Number(
                paymentPenalty.value || 0
            );


        const note =
            paymentNote.value.trim();


        if (!date) {

            alert(
                "Please select payment date."
            );


            return;
        }


        if (amount < 0) {

            alert(
                "Payment amount cannot be negative."
            );


            return;
        }


        if (penalty < 0) {

            alert(
                "Penalty cannot be negative."
            );


            return;
        }


        if (
            amount === 0 &&
            penalty === 0
        ) {

            alert(
                "Please enter either a payment amount or a penalty."
            );


            return;
        }


        const balance =
            getBalance(loan);


        if (amount > balance) {

            alert(
                "Payment cannot be greater than the current balance of " +
                formatMoney(balance)
            );


            return;
        }


        const { error } =
            await supabaseClient
                .from("repayments")
                .insert({

                    loan_id:
                        loan.id,

                    payment_date:
                        date,

                    payment_amount:
                        amount,

                    penalty:
                        penalty,

                    note:
                        note
                });


        if (error) {

            console.error(
                "Insert repayment error:",
                error
            );


            alert(
                "Unable to save repayment.\n\n" +
                error.message
            );


            return;
        }


        repaymentForm.reset();


        await loadLoans();


        updateRepaymentModal();

        renderLoans();

        updateDashboard();


        alert(
            "Repayment saved successfully."
        );
    }
);



// ======================================================
// CLOSE REPAYMENT MODAL
// ======================================================

function closeRepaymentModal() {

    repaymentModal.style.display =
        "none";


    selectedLoanId = null;


    repaymentForm.reset();
}



// ======================================================
// CLOSE MODAL BY CLICKING OUTSIDE
// ======================================================

window.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            repaymentModal
        ) {

            closeRepaymentModal();
        }
    }
);



// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {

    totalBorrowers.textContent =
        loans.length;


    const totalLoanAmount =
        loans.reduce(
            function (total, loan) {

                return total +
                    Number(
                        loan.loanAmount || 0
                    );

            },
            0
        );


    const totalPaidAmount =
        loans.reduce(
            function (total, loan) {

                return total +
                    getTotalPaid(loan);

            },
            0
        );


    const totalOutstandingAmount =
        loans.reduce(
            function (total, loan) {

                return total +
                    getBalance(loan);

            },
            0
        );


    totalLoans.textContent =
        formatMoney(
            totalLoanAmount
        );


    totalRepaid.textContent =
        formatMoney(
            totalPaidAmount
        );


    totalOutstanding.textContent =
        formatMoney(
            totalOutstandingAmount
        );
}



// ======================================================
// START APPLICATION
// ======================================================

loadLoans();

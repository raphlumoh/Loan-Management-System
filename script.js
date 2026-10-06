// ============================================================
// LOAN MANAGEMENT SYSTEM
// COMPLETE script.js
// ============================================================


// ============================================================
// SUPABASE CONNECTION
// ============================================================

const SUPABASE_URL =
    "https://ynqxjcugrdsogwrkhgor.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_4W0EBlrR4djDQ5QXTFtLkg_esHU8L_-";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ============================================================
// APPLICATION STATE
// ============================================================

let loans = [];

let editingLoanId = null;

let selectedLoanId = null;

let isAdminLoggedIn = false;


// ============================================================
// LOGIN / ADMIN ELEMENTS
// ============================================================

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");

const adminLoginBox =
    document.getElementById("adminLoginBox");

const adminStatusBox =
    document.getElementById("adminStatusBox");

const adminStatusMessage =
    document.getElementById("adminStatusMessage");

const logoutButton =
    document.getElementById("logoutButton");

const adminBorrowerForm =
    document.getElementById("adminBorrowerForm");


// ============================================================
// LOAN ELEMENTS
// ============================================================

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


// ============================================================
// DASHBOARD ELEMENTS
// ============================================================

const totalBorrowers =
    document.getElementById("totalBorrowers");

const totalLoans =
    document.getElementById("totalLoans");

const totalRepaid =
    document.getElementById("totalRepaid");

const totalOutstanding =
    document.getElementById("totalOutstanding");


// ============================================================
// REPAYMENT MODAL ELEMENTS
// ============================================================

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


// ============================================================
// FORMAT MONEY
// ============================================================

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


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// CONVERT DATABASE LOAN
// ============================================================

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

        createdAt: row.created_at
    };
}


// ============================================================
// TOTAL PAID
// ============================================================

function getTotalPaid(loan) {

    if (!loan.repayments) {
        return 0;
    }

    return loan.repayments.reduce(
        (total, payment) => {

            return total +
                Number(payment.amount || 0);

        },
        0
    );
}


// ============================================================
// TOTAL PENALTY
// ============================================================

function getTotalPenalty(loan) {

    if (!loan.repayments) {
        return 0;
    }

    return loan.repayments.reduce(
        (total, payment) => {

            return total +
                Number(payment.penalty || 0);

        },
        0
    );
}


// ============================================================
// BALANCE
//
// Balance = Total Repay
//         + Total Penalties
//         - Total Payments
// ============================================================

function getBalance(loan) {

    const repay =
        Number(loan.repayAmount || 0);

    const paid =
        getTotalPaid(loan);

    const penalty =
        getTotalPenalty(loan);

    return Math.max(
        0,
        repay + penalty - paid
    );
}


// ============================================================
// UPDATE LOAN TABLE HEADER
// ============================================================

function updateLoanTableHeader() {

    const table =
        loanTableBody?.closest("table");

    if (!table) {
        return;
    }

    const headerRow =
        table.querySelector("thead tr");

    if (!headerRow) {
        return;
    }


    // ========================================================
    // ADMIN HEADER
    // ========================================================

    if (isAdminLoggedIn) {

        headerRow.innerHTML = `

            <th>ID</th>
            <th>Borrower</th>
            <th>Guarantor 1</th>
            <th>Guarantor 2</th>
            <th>Loan Amount</th>
            <th>Total Repay</th>
            <th>Paid</th>
            <th>Penalty</th>
            <th>Balance</th>
            <th>Actions</th>

        `;

        return;
    }


    // ========================================================
    // PUBLIC HEADER
    // ========================================================

    headerRow.innerHTML = `

        <th>ID</th>
        <th>Borrower</th>
        <th>Guarantor 1</th>
        <th>Guarantor 2</th>
        <th>Loan Amount</th>
        <th>Total Repay</th>
        <th>Paid</th>
        <th>Balance</th>
        <th>Actions</th>

    `;
}


// ============================================================
// UPDATE ADMIN INTERFACE
// ============================================================

function updateAdminInterface(session) {

    isAdminLoggedIn = !!session;


    updateLoanTableHeader();


    if (session) {

        if (adminLoginBox) {

            adminLoginBox.style.display =
                "none";
        }


        if (adminStatusBox) {

            adminStatusBox.style.display =
                "block";
        }


        if (adminStatusMessage) {

            adminStatusMessage.textContent =
                "You are logged in as administrator.";
        }


        if (adminBorrowerForm) {

            adminBorrowerForm.style.display =
                "block";
        }

    } else {

        if (adminLoginBox) {

            adminLoginBox.style.display =
                "block";
        }


        if (adminStatusBox) {

            adminStatusBox.style.display =
                "none";
        }


        if (adminBorrowerForm) {

            adminBorrowerForm.style.display =
                "none";
        }
    }


    if (loans.length > 0) {

        renderLoans(
            searchInput
                ? searchInput.value
                : ""
        );
    }


    updateDashboard();
}


// ============================================================
// CHECK ADMIN SESSION
// ============================================================

async function checkAdminSession() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Session check error:",
            error
        );

        updateAdminInterface(null);

        return;
    }


    updateAdminInterface(
        data.session
    );
}


// ============================================================
// LOGIN
// ============================================================

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


            if (loginMessage) {

                loginMessage.textContent =
                    "Logging in...";
            }


            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .signInWithPassword({

                        email: email,

                        password: password

                    });


            if (error) {

                console.error(error);

                if (loginMessage) {

                    loginMessage.textContent =
                        error.message;
                }

                return;
            }


            if (loginMessage) {

                loginMessage.textContent =
                    "Login successful.";
            }


            updateAdminInterface(
                data.session
            );
        }
    );
}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            const {
                error
            } =
                await supabaseClient.auth
                    .signOut();


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


// ============================================================
// AUTH STATE CHANGE
// ============================================================

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


// ============================================================
// LOAD REPAYMENTS
// ============================================================

async function loadRepayments() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("repayments")
            .select("*")
            .order(
                "payment_date",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Error loading repayments:",
            error
        );

        return [];
    }


    return data || [];
}


// ============================================================
// LOAD LOANS
// ============================================================

async function loadLoans() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("loans")
            .select("*")
            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error loading loans:",
            error
        );

        alert(
            "Could not load borrowers: " +
            error.message
        );

        return;
    }


    loans =
        (data || []).map(
            convertLoan
        );


    const repayments =
        await loadRepayments();


    loans.forEach(
        loan => {

            loan.repayments =
                repayments
                    .filter(
                        repayment =>
                            Number(
                                repayment.loan_id
                            ) ===
                            Number(loan.id)
                    )
                    .map(
                        repayment => ({

                            id:
                                repayment.id,

                            date:
                                repayment.payment_date,

                            amount:
                                Number(
                                    repayment.payment_amount ||
                                    0
                                ),

                            penalty:
                                Number(
                                    repayment.penalty ||
                                    0
                                ),

                            note:
                                repayment.note ||
                                ""
                        })
                    );
        }
    );


    renderLoans(
        searchInput
            ? searchInput.value
            : ""
    );


    updateDashboard();
}


// ============================================================
// RENDER LOANS
//
// Borrowers are arranged A-Z.
// ============================================================

function renderLoans(searchTerm = "") {

    if (!loanTableBody) {
        return;
    }


    const term =
        String(searchTerm || "")
            .trim()
            .toLowerCase();


    const filteredLoans =
        loans.filter(
            loan => {

                if (!term) {
                    return true;
                }


                return (

                    String(
                        loan.borrower
                    )
                        .toLowerCase()
                        .includes(term)

                    ||

                    String(
                        loan.guarantor1
                    )
                        .toLowerCase()
                        .includes(term)

                    ||

                    String(
                        loan.guarantor2
                    )
                        .toLowerCase()
                        .includes(term)

                    ||

                    String(
                        loan.loanAmount
                    )
                        .toLowerCase()
                        .includes(term)

                    ||

                    String(
                        loan.repayAmount
                    )
                        .toLowerCase()
                        .includes(term)
                );
            }
        );


    // ========================================================
    // ALPHABETICAL SORT
    // ========================================================

    filteredLoans.sort(
        (a, b) => {

            const nameA =
                String(
                    a.borrower || ""
                ).trim();


            const nameB =
                String(
                    b.borrower || ""
                ).trim();


            return nameA.localeCompare(
                nameB,
                "en",
                {
                    sensitivity: "base"
                }
            );
        }
    );


    loanTableBody.innerHTML = "";


    if (filteredLoans.length === 0) {

        if (emptyMessage) {

            emptyMessage.style.display =
                "block";
        }


        updateLoanTableHeader();

        return;

    } else {

        if (emptyMessage) {

            emptyMessage.style.display =
                "none";
        }
    }


    filteredLoans.forEach(
        (loan, index) => {

            const totalPaid =
                getTotalPaid(loan);


            const totalPenalty =
                getTotalPenalty(loan);


            const balance =
                getBalance(loan);


            const row =
                document.createElement("tr");


            // =================================================
            // ADMIN VIEW
            // =================================================

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
                            totalPaid
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            totalPenalty
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            balance
                        )}
                    </td>

                    <td>

                        <button
                            class="action-btn"
                            onclick="openRepaymentModal(${loan.id})"
                        >
                            Repayment
                        </button>

                        <button
                            class="action-btn"
                            onclick="editLoan(${loan.id})"
                        >
                            Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteLoan(${loan.id})"
                        >
                            Delete
                        </button>

                    </td>

                `;

            } else {

                // =================================================
                // PUBLIC VIEW
                // =================================================

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
                            totalPaid
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            balance
                        )}
                    </td>

                    <td>

                        <button
                            class="action-btn"
                            onclick="openRepaymentModal(${loan.id})"
                        >
                            Repayment
                        </button>

                    </td>

                `;
            }


            loanTableBody.appendChild(row);
        }
    );


    updateLoanTableHeader();
}


// ============================================================
// UPDATE DASHBOARD
//
// IMPORTANT:
//
// Total Borrowers = NUMBER of borrowers
//
// Total Loans = TOTAL ₦ VALUE of all loans
//
// Total Repaid = TOTAL payments received
//
// Total Outstanding = TOTAL remaining balance
// ============================================================

function updateDashboard() {

    // ========================================================
    // TOTAL BORROWERS
    // ========================================================

    const borrowerCount =
        loans.length;


    // ========================================================
    // TOTAL LOANS
    //
    // THIS IS THE IMPORTANT FIX.
    //
    // It adds the actual loan amounts together.
    // It does NOT display the number of loans.
    // ========================================================

    const loanTotal =
        loans.reduce(
            (total, loan) => {

                return total +
                    Number(
                        loan.loanAmount || 0
                    );

            },
            0
        );


    // ========================================================
    // TOTAL REPAID
    // ========================================================

    const repaid =
        loans.reduce(
            (total, loan) => {

                return total +
                    getTotalPaid(loan);

            },
            0
        );


    // ========================================================
    // TOTAL OUTSTANDING
    // ========================================================

    const outstanding =
        loans.reduce(
            (total, loan) => {

                return total +
                    getBalance(loan);

            },
            0
        );


    // ========================================================
    // DISPLAY TOTAL BORROWERS
    // ========================================================

    if (totalBorrowers) {

        totalBorrowers.textContent =
            borrowerCount;
    }


    // ========================================================
    // DISPLAY TOTAL LOANS
    //
    // NOW SHOWS ₦ AMOUNT
    // ========================================================

    if (totalLoans) {

        totalLoans.textContent =
            formatMoney(
                loanTotal
            );
    }


    // ========================================================
    // DISPLAY TOTAL REPAID
    // ========================================================

    if (totalRepaid) {

        totalRepaid.textContent =
            formatMoney(
                repaid
            );
    }


    // ========================================================
    // DISPLAY TOTAL OUTSTANDING
    // ========================================================

    if (totalOutstanding) {

        totalOutstanding.textContent =
            formatMoney(
                outstanding
            );
    }
}


// ============================================================
// ADD / UPDATE BORROWER
// ============================================================

if (loanForm) {

    loanForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!isAdminLoggedIn) {

                alert(
                    "Only the administrator can save borrowers."
                );

                return;
            }


            const borrower =
                borrowerName.value.trim();


            const guarantorOne =
                guarantor1.value.trim();


            const guarantorTwo =
                guarantor2.value.trim();


            const loanValue =
                Number(
                    loanAmount.value || 0
                );


            const repayValue =
                Number(
                    repayAmount.value || 0
                );


            if (!borrower) {

                alert(
                    "Please enter the borrower name."
                );

                return;
            }


            if (!guarantorOne) {

                alert(
                    "Please enter Guarantor 1."
                );

                return;
            }


            if (!guarantorTwo) {

                alert(
                    "Please enter Guarantor 2."
                );

                return;
            }


            if (loanValue <= 0) {

                alert(
                    "Please enter a valid loan amount."
                );

                return;
            }


            if (repayValue < 0) {

                alert(
                    "Repay amount cannot be negative."
                );

                return;
            }


            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "Saving...";
            }


            let error;


            // =================================================
            // UPDATE EXISTING LOAN
            // =================================================

            if (editingLoanId !== null) {

                const result =
                    await supabaseClient
                        .from("loans")
                        .update({

                            borrower_name:
                                borrower,

                            guarantor1:
                                guarantorOne,

                            guarantor2:
                                guarantorTwo,

                            loan_amount:
                                loanValue,

                            repay_amount:
                                repayValue

                        })
                        .eq(
                            "id",
                            editingLoanId
                        );


                error =
                    result.error;


            } else {

                // =================================================
                // ADD NEW LOAN
                // =================================================

                const result =
                    await supabaseClient
                        .from("loans")
                        .insert({

                            borrower_name:
                                borrower,

                            guarantor1:
                                guarantorOne,

                            guarantor2:
                                guarantorTwo,

                            loan_amount:
                                loanValue,

                            repay_amount:
                                repayValue

                        });


                error =
                    result.error;
            }


            if (error) {

                console.error(
                    "Save loan error:",
                    error
                );


                alert(
                    "Could not save borrower: " +
                    error.message
                );

            } else {

                alert(
                    editingLoanId !== null
                        ? "Borrower updated successfully."
                        : "Borrower saved successfully."
                );


                resetLoanForm();


                await loadLoans();
            }


            if (saveButton) {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "Save Borrower";
            }
        }
    );
}


// ============================================================
// RESET LOAN FORM
// ============================================================

function resetLoanForm() {

    editingLoanId = null;


    if (loanForm) {

        loanForm.reset();
    }


    if (formTitle) {

        formTitle.textContent =
            "Add Borrower";
    }


    if (saveButton) {

        saveButton.textContent =
            "Save Borrower";
    }


    if (cancelButton) {

        cancelButton.style.display =
            "none";
    }
}


// ============================================================
// CANCEL EDIT
// ============================================================

if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        function () {

            resetLoanForm();
        }
    );
}


// ============================================================
// EDIT LOAN
// ============================================================

window.editLoan =
    function (id) {

        if (!isAdminLoggedIn) {

            alert(
                "Only the administrator can edit borrowers."
            );

            return;
        }


        const loan =
            loans.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!loan) {
            return;
        }


        editingLoanId =
            loan.id;


        borrowerName.value =
            loan.borrower || "";


        guarantor1.value =
            loan.guarantor1 || "";


        guarantor2.value =
            loan.guarantor2 || "";


        loanAmount.value =
            loan.loanAmount;


        repayAmount.value =
            loan.repayAmount;


        if (formTitle) {

            formTitle.textContent =
                "Edit Borrower";
        }


        if (saveButton) {

            saveButton.textContent =
                "Update Borrower";
        }


        if (cancelButton) {

            cancelButton.style.display =
                "inline-block";
        }


        if (adminBorrowerForm) {

            adminBorrowerForm.scrollIntoView({
                behavior: "smooth"
            });
        }
    };


// ============================================================
// DELETE LOAN
// ============================================================

window.deleteLoan =
    async function (id) {

        if (!isAdminLoggedIn) {

            alert(
                "Only the administrator can delete borrowers."
            );

            return;
        }


        const loan =
            loans.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!loan) {
            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to delete " +
                loan.borrower +
                "?\n\nAll repayment records for this borrower will also be deleted."
            );


        if (!confirmed) {
            return;
        }


        const {
            error
        } =
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
                "Could not delete borrower: " +
                error.message
            );


            return;
        }


        alert(
            "Borrower deleted successfully."
        );


        await loadLoans();
    };


// ============================================================
// SEARCH
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            renderLoans(
                searchInput.value
            );
        }
    );
}


// ============================================================
// OPEN REPAYMENT MODAL
// ============================================================

window.openRepaymentModal =
    function (id) {

        const loan =
            loans.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!loan) {
            return;
        }


        selectedLoanId =
            loan.id;


        updateRepaymentModal(
            loan
        );


        if (repaymentModal) {

            repaymentModal.style.display =
                "block";
        }
    };


// ============================================================
// UPDATE REPAYMENT MODAL
// ============================================================

function updateRepaymentModal(loan) {

    if (!loan) {
        return;
    }


    if (modalBorrowerName) {

        modalBorrowerName.textContent =
            loan.borrower;
    }


    if (modalLoanAmount) {

        modalLoanAmount.textContent =
            formatMoney(
                loan.loanAmount
            );
    }


    if (modalRepayAmount) {

        modalRepayAmount.textContent =
            formatMoney(
                loan.repayAmount
            );
    }


    const totalPaid =
        getTotalPaid(loan);


    const totalPenalty =
        getTotalPenalty(loan);


    const balance =
        getBalance(loan);


    if (modalTotalPaid) {

        modalTotalPaid.textContent =
            formatMoney(
                totalPaid
            );
    }


    if (modalTotalPenalty) {

        modalTotalPenalty.textContent =
            formatMoney(
                totalPenalty
            );
    }


    if (modalBalance) {

        modalBalance.textContent =
            formatMoney(
                balance
            );
    }


    // ========================================================
    // HIDE PENALTY FROM PUBLIC
    // ========================================================

    const penaltySummaryBox =
        modalTotalPenalty
            ?.closest(".summary-box");


    if (penaltySummaryBox) {

        penaltySummaryBox.style.display =
            isAdminLoggedIn
                ? ""
                : "none";
    }


    const penaltyInputGroup =
        paymentPenalty
            ?.closest(".form-group");


    if (penaltyInputGroup) {

        penaltyInputGroup.style.display =
            isAdminLoggedIn
                ? ""
                : "none";
    }


    if (repaymentForm) {

        repaymentForm.style.display =
            isAdminLoggedIn
                ? ""
                : "none";
    }


    displayRepaymentHistory(
        loan
    );
}


// ============================================================
// REPAYMENT HISTORY
// ============================================================

function displayRepaymentHistory(loan) {

    if (!repaymentHistory) {
        return;
    }


    repaymentHistory.innerHTML = "";


    const repayments =
        loan.repayments || [];


    if (repayments.length === 0) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td
                colspan="${isAdminLoggedIn ? 5 : 4}"
                style="text-align:center;"
            >
                No repayment records yet.
            </td>

        `;


        repaymentHistory.appendChild(
            row
        );


        return;
    }


    repayments.forEach(
        repayment => {

            const row =
                document.createElement("tr");


            if (isAdminLoggedIn) {

                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            repayment.date
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            repayment.amount
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            repayment.penalty
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            repayment.note
                        )}
                    </td>

                    <td>

                        <button
                            class="delete-btn"
                            data-repayment-id="${repayment.id}"
                        >
                            Delete
                        </button>

                    </td>

                `;

            } else {

                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            repayment.date
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            repayment.amount
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            repayment.note
                        )}
                    </td>

                    <td>
                        ${repayment.amount > 0
                            ? "Payment"
                            : "Record"}
                    </td>

                `;
            }


            repaymentHistory.appendChild(
                row
            );
        }
    );
}


// ============================================================
// DELETE REPAYMENT
// ============================================================

if (repaymentHistory) {

    repaymentHistory.addEventListener(
        "click",
        async function (event) {

            const button =
                event.target.closest(
                    "[data-repayment-id]"
                );


            if (!button) {
                return;
            }


            if (!isAdminLoggedIn) {

                alert(
                    "Only the administrator can delete repayment records."
                );

                return;
            }


            const repaymentId =
                button.dataset.repaymentId;


            const confirmed =
                confirm(
                    "Are you sure you want to delete this repayment record?"
                );


            if (!confirmed) {
                return;
            }


            const {
                error
            } =
                await supabaseClient
                    .from("repayments")
                    .delete()
                    .eq(
                        "id",
                        repaymentId
                    );


            if (error) {

                console.error(
                    "Delete repayment error:",
                    error
                );


                alert(
                    "Could not delete repayment: " +
                    error.message
                );


                return;
            }


            await loadLoans();


            const loan =
                loans.find(
                    item =>
                        Number(item.id) ===
                        Number(selectedLoanId)
                );


            if (loan) {

                updateRepaymentModal(
                    loan
                );
            }
        }
    );
}


// ============================================================
// ADD REPAYMENT
// ============================================================

if (repaymentForm) {

    repaymentForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!isAdminLoggedIn) {

                alert(
                    "Only the administrator can add repayments."
                );

                return;
            }


            if (selectedLoanId === null) {

                alert(
                    "No borrower selected."
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
                    "Please select the payment date."
                );

                return;
            }


            if (
                amount < 0 ||
                penalty < 0
            ) {

                alert(
                    "Payment and penalty cannot be negative."
                );

                return;
            }


            if (
                amount === 0 &&
                penalty === 0 &&
                !note
            ) {

                alert(
                    "Please enter a payment, penalty, or note."
                );

                return;
            }


            const {
                error
            } =
                await supabaseClient
                    .from("repayments")
                    .insert({

                        loan_id:
                            selectedLoanId,

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
                    "Add repayment error:",
                    error
                );


                alert(
                    "Could not save repayment: " +
                    error.message
                );


                return;
            }


            alert(
                "Repayment record saved successfully."
            );


            paymentAmount.value =
                "0";


            paymentPenalty.value =
                "0";


            paymentNote.value =
                "";


            await loadLoans();


            const loan =
                loans.find(
                    item =>
                        Number(item.id) ===
                        Number(selectedLoanId)
                );


            if (loan) {

                updateRepaymentModal(
                    loan
                );
            }
        }
    );
}


// ============================================================
// CLOSE REPAYMENT MODAL
// ============================================================

window.closeRepaymentModal =
    function () {

        selectedLoanId = null;


        if (repaymentModal) {

            repaymentModal.style.display =
                "none";
        }
    };


// ============================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ============================================================

window.addEventListener(
    "click",
    function (event) {

        if (
            repaymentModal &&
            event.target === repaymentModal
        ) {

            closeRepaymentModal();
        }
    }
);


// ============================================================
// START APPLICATION
// ============================================================

checkAdminSession();

loadLoans();

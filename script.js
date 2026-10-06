/* =========================================================
   LOAN MANAGEMENT SYSTEM
   Supabase + JavaScript
   ========================================================= */


/* =========================================================
   SUPABASE CONNECTION
   ========================================================= */

const SUPABASE_URL =
    "https://ynqxjcugrdsogwrkhgor.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_4W0EBlR4djDQ5QXTFtLkg_esHU8L_-";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let loans = [];

let editingLoanId = null;

let selectedLoan = null;

let isAdminLoggedIn = false;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const adminLoginBox =
    document.getElementById("adminLoginBox");

const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const loginMessage =
    document.getElementById("loginMessage");

const adminStatusBox =
    document.getElementById("adminStatusBox");

const adminStatusMessage =
    document.getElementById("adminStatusMessage");

const logoutButton =
    document.getElementById("logoutButton");

const mainApp =
    document.getElementById("mainApp");

const adminBorrowerForm =
    document.getElementById("adminBorrowerForm");

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


/* =========================================================
   DASHBOARD ELEMENTS
   ========================================================= */

const totalBorrowers =
    document.getElementById("totalBorrowers");

const totalLoans =
    document.getElementById("totalLoans");

const totalRepaid =
    document.getElementById("totalRepaid");

const totalOutstanding =
    document.getElementById("totalOutstanding");


/* =========================================================
   REPAYMENT MODAL ELEMENTS
   ========================================================= */

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


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function formatMoney(value) {

    const number =
        Number(value || 0);

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2
        }
    ).format(number);
}


function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   REPAYMENT CALCULATIONS
   ========================================================= */

function getTotalPaid(loan) {

    if (!loan ||
        !Array.isArray(loan.repayments)) {

        return 0;
    }

    return loan.repayments.reduce(
        (total, repayment) => {

            return total +
                Number(
                    repayment.amount || 0
                );

        },
        0
    );
}


function getTotalPenalty(loan) {

    if (!loan ||
        !Array.isArray(loan.repayments)) {

        return 0;
    }

    return loan.repayments.reduce(
        (total, repayment) => {

            return total +
                Number(
                    repayment.penalty || 0
                );

        },
        0
    );
}


/*
   Balance formula:

   Balance =
   Total Repay
   + Total Penalties
   - Total Payments
*/

function getBalance(loan) {

    const repay =
        Number(
            loan.repayAmount || 0
        );

    const penalty =
        getTotalPenalty(loan);

    const paid =
        getTotalPaid(loan);

    return repay +
        penalty -
        paid;
}


/* =========================================================
   LOAD LOANS FROM SUPABASE
   ========================================================= */

async function loadLoans() {

    try {

        const {
            data: loanData,
            error: loanError
        } = await supabaseClient
            .from("loans")
            .select("*")
            .order(
                "borrower_name",
                {
                    ascending: true
                }
            );

        if (loanError) {

            console.error(
                "Error loading loans:",
                loanError
            );

            alert(
                "Unable to load loan records."
            );

            return;
        }


        const {
            data: repaymentData,
            error: repaymentError
        } = await supabaseClient
            .from("repayments")
            .select("*")
            .order(
                "payment_date",
                {
                    ascending: false
                }
            );


        if (repaymentError) {

            console.error(
                "Error loading repayments:",
                repaymentError
            );

            alert(
                "Unable to load repayment records."
            );

            return;
        }


        const repaymentList =
            repaymentData || [];


        loans =
            (loanData || []).map(
                loan => {

                    const repayments =
                        repaymentList
                            .filter(
                                repayment =>
                                    Number(
                                        repayment.loan_id
                                    ) ===
                                    Number(
                                        loan.id
                                    )
                            )
                            .map(
                                repayment => {

                                    return {
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
                                    };
                                }
                            );


                    return {

                        id:
                            loan.id,

                        borrowerName:
                            loan.borrower_name,

                        guarantor1:
                            loan.guarantor1,

                        guarantor2:
                            loan.guarantor2,

                        loanAmount:
                            Number(
                                loan.loan_amount ||
                                0
                            ),

                        repayAmount:
                            Number(
                                loan.repay_amount ||
                                0
                            ),

                        createdAt:
                            loan.created_at,

                        repayments:
                            repayments
                    };
                }
            );


        updateDashboard();

        displayLoans();

    } catch (error) {

        console.error(
            "Unexpected loading error:",
            error
        );
    }
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

    /*
       Total Borrowers =
       Number of borrower records
    */

    const borrowerCount =
        loans.length;


    /*
       Total Loans =
       Total NGN value of all loans
    */

    const loanTotal =
        loans.reduce(
            (total, loan) => {

                return total +
                    Number(
                        loan.loanAmount ||
                        0
                    );

            },
            0
        );


    /*
       Total Repaid =
       Actual payments made
    */

    const repaid =
        loans.reduce(
            (total, loan) => {

                return total +
                    getTotalPaid(loan);

            },
            0
        );


    /*
       Total Outstanding =
       Balance across all borrowers
    */

    const outstanding =
        loans.reduce(
            (total, loan) => {

                return total +
                    getBalance(loan);

            },
            0
        );


    if (totalBorrowers) {

        totalBorrowers.textContent =
            borrowerCount;
    }


    if (totalLoans) {

        totalLoans.textContent =
            formatMoney(
                loanTotal
            );
    }


    if (totalRepaid) {

        totalRepaid.textContent =
            formatMoney(
                repaid
            );
    }


    if (totalOutstanding) {

        totalOutstanding.textContent =
            formatMoney(
                outstanding
            );
    }
}


/* =========================================================
   ADMIN CHECK
   ========================================================= */

async function checkAdminStatus() {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth
            .getUser();


    if (!user) {

        isAdminLoggedIn =
            false;

        updateInterface();

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("admin_users")
            .select("user_id")
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Admin check error:",
            error
        );

        isAdminLoggedIn =
            false;

    } else {

        isAdminLoggedIn =
            !!data;
    }


    updateInterface();
}


/* =========================================================
   UPDATE INTERFACE
   ========================================================= */

function updateInterface() {

    if (adminLoginBox) {

        adminLoginBox.style.display =
            isAdminLoggedIn
                ? "none"
                : "block";
    }


    if (adminStatusBox) {

        adminStatusBox.style.display =
            isAdminLoggedIn
                ? "block"
                : "none";
    }


    if (adminBorrowerForm) {

        adminBorrowerForm.style.display =
            isAdminLoggedIn
                ? "block"
                : "none";
    }


    if (adminStatusMessage) {

        if (isAdminLoggedIn) {

            adminStatusMessage.textContent =
                "You are logged in as administrator.";

        } else {

            adminStatusMessage.textContent =
                "";
        }
    }


    updateLoanTableHeader();

    updateRepaymentHistoryHeader();

    displayLoans();
}


/* =========================================================
   LOGIN
   ========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const email =
                loginEmail
                    ? loginEmail.value.trim()
                    : "";

            const password =
                loginPassword
                    ? loginPassword.value
                    : "";


            if (!email ||
                !password) {

                if (loginMessage) {

                    loginMessage.textContent =
                        "Please enter your email and password.";
                }

                return;
            }


            if (loginMessage) {

                loginMessage.textContent =
                    "Logging in...";
            }


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth
                        .signInWithPassword({
                            email:
                                email,

                            password:
                                password
                        });


                if (error) {

                    console.error(
                        "Login error:",
                        error
                    );

                    if (loginMessage) {

                        loginMessage.textContent =
                            error.message;
                    }

                    return;
                }


                if (!data ||
                    !data.user) {

                    if (loginMessage) {

                        loginMessage.textContent =
                            "Login was not successful.";
                    }

                    return;
                }


                await checkAdminStatus();


                if (!isAdminLoggedIn) {

                    await supabaseClient.auth
                        .signOut();

                    isAdminLoggedIn =
                        false;

                    updateInterface();

                    if (loginMessage) {

                        loginMessage.textContent =
                            "This account is not authorized as an administrator.";
                    }

                    return;
                }


                if (loginMessage) {

                    loginMessage.textContent =
                        "Login successful.";
                }


                if (loginForm) {

                    loginForm.reset();
                }


                await loadLoans();

            } catch (error) {

                console.error(
                    "Unexpected login error:",
                    error
                );

                if (loginMessage) {

                    loginMessage.textContent =
                        "An unexpected error occurred during login.";
                }
            }
        }
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function() {

            await supabaseClient.auth
                .signOut();

            isAdminLoggedIn =
                false;

            editingLoanId =
                null;

            selectedLoan =
                null;

            resetLoanForm();

            updateInterface();

            await loadLoans();
        }
    );
}


/* =========================================================
   AUTH STATE CHANGE
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
    async function(event) {

        if (event === "SIGNED_IN" ||
            event === "SIGNED_OUT") {

            await checkAdminStatus();

            await loadLoans();
        }
    }
);


/* =========================================================
   SAVE / UPDATE LOAN
   ========================================================= */

if (loanForm) {

    loanForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            if (!isAdminLoggedIn) {

                alert(
                    "Only an administrator can save loan records."
                );

                return;
            }


            const name =
                borrowerName
                    ? borrowerName.value.trim()
                    : "";

            const g1 =
                guarantor1
                    ? guarantor1.value.trim()
                    : "";

            const g2 =
                guarantor2
                    ? guarantor2.value.trim()
                    : "";

            const amount =
                Number(
                    loanAmount
                        ? loanAmount.value
                        : 0
                );

            const repay =
                Number(
                    repayAmount
                        ? repayAmount.value
                        : 0
                );


            if (!name ||
                !g1 ||
                !g2) {

                alert(
                    "Please complete the borrower and guarantor information."
                );

                return;
            }


            if (amount <= 0) {

                alert(
                    "Please enter a valid loan amount."
                );

                return;
            }


            if (repay < 0) {

                alert(
                    "Repayment amount cannot be negative."
                );

                return;
            }


            try {

                if (editingLoanId) {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("loans")
                            .update({

                                borrower_name:
                                    name,

                                guarantor1:
                                    g1,

                                guarantor2:
                                    g2,

                                loan_amount:
                                    amount,

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
                            "Unable to update borrower: " +
                            error.message
                        );

                        return;
                    }


                    alert(
                        "Borrower updated successfully."
                    );

                } else {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("loans")
                            .insert({

                                borrower_name:
                                    name,

                                guarantor1:
                                    g1,

                                guarantor2:
                                    g2,

                                loan_amount:
                                    amount,

                                repay_amount:
                                    repay
                            });


                    if (error) {

                        console.error(
                            "Insert loan error:",
                            error
                        );

                        alert(
                            "Unable to save borrower: " +
                            error.message
                        );

                        return;
                    }


                    alert(
                        "Borrower saved successfully."
                    );
                }


                resetLoanForm();

                await loadLoans();

            } catch (error) {

                console.error(
                    "Save loan error:",
                    error
                );

                alert(
                    "An unexpected error occurred."
                );
            }
        }
    );
}


/* =========================================================
   RESET LOAN FORM
   ========================================================= */

function resetLoanForm() {

    editingLoanId =
        null;


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


/* =========================================================
   CANCEL EDIT
   ========================================================= */

if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        function() {

            resetLoanForm();
        }
    );
}


/* =========================================================
   EDIT LOAN
   ========================================================= */

window.editLoan =
    function(id) {

        if (!isAdminLoggedIn) {

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


        if (borrowerName) {

            borrowerName.value =
                loan.borrowerName;
        }


        if (guarantor1) {

            guarantor1.value =
                loan.guarantor1;
        }


        if (guarantor2) {

            guarantor2.value =
                loan.guarantor2;
        }


        if (loanAmount) {

            loanAmount.value =
                loan.loanAmount;
        }


        if (repayAmount) {

            repayAmount.value =
                loan.repayAmount;
        }


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

            adminBorrowerForm
                .scrollIntoView({
                    behavior: "smooth"
                });
        }
    };


/* =========================================================
   DELETE LOAN
   ========================================================= */

window.deleteLoan =
    async function(id) {

        if (!isAdminLoggedIn) {

            alert(
                "Only an administrator can delete records."
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
                loan.borrowerName +
                " and all repayment records?"
            );


        if (!confirmed) {

            return;
        }


        try {

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
                    "Unable to delete borrower: " +
                    error.message
                );

                return;
            }


            alert(
                "Borrower deleted successfully."
            );


            await loadLoans();

        } catch (error) {

            console.error(
                "Unexpected delete error:",
                error
            );

            alert(
                "An unexpected error occurred."
            );
        }
    };


/* =========================================================
   DISPLAY LOANS
   ========================================================= */

function displayLoans() {

    if (!loanTableBody) {

        return;
    }


    loanTableBody.innerHTML =
        "";


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    let filteredLoans =
        loans.filter(
            loan => {

                if (!searchTerm) {

                    return true;
                }


                const text =
                    [
                        loan.borrowerName,
                        loan.guarantor1,
                        loan.guarantor2,
                        loan.loanAmount,
                        loan.repayAmount
                    ]
                        .join(" ")
                        .toLowerCase();


                return text.includes(
                    searchTerm
                );
            }
        );


    /*
       Always sort borrowers A-Z
       by borrower name.
    */

    filteredLoans.sort(
        (a, b) => {

            return a.borrowerName
                .localeCompare(
                    b.borrowerName,
                    undefined,
                    {
                        sensitivity:
                            "base"
                    }
                );
        }
    );


    if (filteredLoans.length === 0) {

        if (emptyMessage) {

            emptyMessage.style.display =
                "block";
        }

        return;

    } else {

        if (emptyMessage) {

            emptyMessage.style.display =
                "none";
        }
    }


    filteredLoans.forEach(
        (loan, index) => {

            const row =
                document.createElement("tr");


            const totalPaid =
                getTotalPaid(loan);


            const totalPenalty =
                getTotalPenalty(loan);


            const balance =
                getBalance(loan);


            if (isAdminLoggedIn) {

                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            loan.borrowerName
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
                            type="button"
                            class="edit-btn"
                            onclick="editLoan(${loan.id})"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="delete-btn"
                            onclick="deleteLoan(${loan.id})"
                        >
                            Delete
                        </button>

                        <button
                            type="button"
                            class="repayment-btn"
                            onclick="openRepaymentModal(${loan.id})"
                        >
                            Repayment
                        </button>

                    </td>
                `;

            } else {

                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            loan.borrowerName
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
                            type="button"
                            class="repayment-btn"
                            onclick="openRepaymentModal(${loan.id})"
                        >
                            Repayment
                        </button>

                    </td>
                `;
            }


            loanTableBody.appendChild(
                row
            );
        }
    );
}


/* =========================================================
   SEARCH
   ========================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function() {

            displayLoans();
        }
    );
}


/* =========================================================
   UPDATE MAIN TABLE HEADER
   ========================================================= */

function updateLoanTableHeader() {

    const table =
        loanTableBody
            ? loanTableBody.closest("table")
            : null;


    if (!table) {

        return;
    }


    const headerRow =
        table.querySelector(
            "thead tr"
        );


    if (!headerRow) {

        return;
    }


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

    } else {

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
}


/* =========================================================
   OPEN REPAYMENT MODAL
   ========================================================= */

window.openRepaymentModal =
    function(loanId) {

        const loan =
            loans.find(
                item =>
                    Number(item.id) ===
                    Number(loanId)
            );


        if (!loan) {

            return;
        }


        selectedLoan =
            loan;


        if (modalBorrowerName) {

            modalBorrowerName.textContent =
                loan.borrowerName;
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


        if (modalTotalPaid) {

            modalTotalPaid.textContent =
                formatMoney(
                    getTotalPaid(loan)
                );
        }


        if (modalTotalPenalty) {

            modalTotalPenalty.textContent =
                formatMoney(
                    getTotalPenalty(loan)
                );
        }


        if (modalBalance) {

            modalBalance.textContent =
                formatMoney(
                    getBalance(loan)
                );
        }


        if (repaymentModal) {

            repaymentModal.style.display =
                "flex";
        }


        updateRepaymentInterface();

        displayRepaymentHistory(
            loan
        );
    };


/* =========================================================
   CLOSE REPAYMENT MODAL
   ========================================================= */

window.closeRepaymentModal =
    function() {

        selectedLoan =
            null;


        if (repaymentModal) {

            repaymentModal.style.display =
                "none";
        }


        if (repaymentForm) {

            repaymentForm.reset();
        }
    };


/* =========================================================
   REPAYMENT INTERFACE
   ========================================================= */

function updateRepaymentInterface() {

    if (!repaymentForm) {

        return;
    }


    /*
       Public users can VIEW
       repayment history.

       Only admins can ADD
       repayment or penalty records.
    */

    if (isAdminLoggedIn) {

        repaymentForm.style.display =
            "block";

    } else {

        repaymentForm.style.display =
            "none";
    }
}


/* =========================================================
   REPAYMENT HISTORY HEADER
   ========================================================= */

function updateRepaymentHistoryHeader() {

    if (!repaymentHistory) {

        return;
    }


    const table =
        repaymentHistory.closest("table");


    if (!table) {

        return;
    }


    const headerRow =
        table.querySelector(
            "thead tr"
        );


    if (!headerRow) {

        return;
    }


    /*
       PUBLIC:
       Date | Payment | Penalty | Note | Type

       ADMIN:
       Date | Payment | Penalty | Note | Action
    */

    if (isAdminLoggedIn) {

        headerRow.innerHTML = `

            <th>Date</th>

            <th>Payment</th>

            <th>Penalty</th>

            <th>Note</th>

            <th>Action</th>
        `;

    } else {

        headerRow.innerHTML = `

            <th>Date</th>

            <th>Payment</th>

            <th>Penalty</th>

            <th>Note</th>

            <th>Type</th>
        `;
    }
}


/* =========================================================
   DISPLAY REPAYMENT HISTORY
   ========================================================= */

function displayRepaymentHistory(loan) {

    if (!repaymentHistory) {

        return;
    }


    repaymentHistory.innerHTML =
        "";


    const repayments =
        Array.isArray(
            loan.repayments
        )
            ? [...loan.repayments]
            : [];


    /*
       Show every entry.

       Newest payment/penalty
       appears first.
    */

    repayments.sort(
        (a, b) => {

            const dateA =
                new Date(
                    a.date || 0
                );

            const dateB =
                new Date(
                    b.date || 0
                );

            return dateB - dateA;
        }
    );


    if (repayments.length === 0) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td
                colspan="5"
                style="text-align:center;"
            >
                No repayment or penalty records yet.
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


            const amount =
                Number(
                    repayment.amount ||
                    0
                );


            const penalty =
                Number(
                    repayment.penalty ||
                    0
                );


            let type =
                "Record";


            if (
                amount > 0 &&
                penalty > 0
            ) {

                type =
                    "Payment + Penalty";

            } else if (
                amount > 0
            ) {

                type =
                    "Payment";

            } else if (
                penalty > 0
            ) {

                type =
                    "Penalty";
            }


            /*
               PUBLIC HISTORY

               The public can now see:

               Date
               Payment
               Penalty
               Note
               Type

               But there are NO
               edit/delete controls.
            */

            if (!isAdminLoggedIn) {

                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            repayment.date
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            amount
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            penalty
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            repayment.note
                        )}
                    </td>

                    <td>
                        ${type}
                    </td>
                `;

            } else {

                /*
                   ADMIN HISTORY

                   Admin sees the same
                   complete information,
                   plus Delete.
                */

                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            repayment.date
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            amount
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            penalty
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            repayment.note
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="delete-btn"
                            data-repayment-id="${repayment.id}"
                        >
                            Delete
                        </button>

                    </td>
                `;
            }


            repaymentHistory.appendChild(
                row
            );
        }
    );


    /*
       Add delete functionality
       to admin repayment buttons.
    */

    if (isAdminLoggedIn) {

        const deleteButtons =
            repaymentHistory.querySelectorAll(
                "[data-repayment-id]"
            );


        deleteButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    async function() {

                        const repaymentId =
                            this.getAttribute(
                                "data-repayment-id"
                            );


                        await deleteRepayment(
                            repaymentId
                        );
                    }
                );
            }
        );
    }
}


/* =========================================================
   ADD PAYMENT / PENALTY
   ========================================================= */

if (repaymentForm) {

    repaymentForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            if (!isAdminLoggedIn) {

                alert(
                    "Only an administrator can add payment or penalty records."
                );

                return;
            }


            if (!selectedLoan) {

                alert(
                    "Please select a borrower first."
                );

                return;
            }


            const date =
                paymentDate
                    ? paymentDate.value
                    : "";


            const amount =
                Number(
                    paymentAmount
                        ? paymentAmount.value
                        : 0
                );


            const penalty =
                Number(
                    paymentPenalty
                        ? paymentPenalty.value
                        : 0
                );


            const note =
                paymentNote
                    ? paymentNote.value.trim()
                    : "";


            /*
               At least payment OR penalty
               must have a value.
            */

            if (
                amount <= 0 &&
                penalty <= 0
            ) {

                alert(
                    "Please enter a payment amount or a penalty amount."
                );

                return;
            }


            if (!date) {

                alert(
                    "Please select a payment date."
                );

                return;
            }


            if (amount < 0 ||
                penalty < 0) {

                alert(
                    "Payment and penalty amounts cannot be negative."
                );

                return;
            }


            try {

                const {
                    error
                } =
                    await supabaseClient
                        .from("repayments")
                        .insert({

                            loan_id:
                                selectedLoan.id,

                            payment_date:
                                date,

                            payment_amount:
                                amount,

                            penalty:
                                penalty,

                            note:
                                note || null
                        });


                if (error) {

                    console.error(
                        "Add repayment error:",
                        error
                    );

                    alert(
                        "Unable to save payment/penalty: " +
                        error.message
                    );

                    return;
                }


                alert(
                    "Payment/penalty record saved successfully."
                );


                repaymentForm.reset();


                await loadLoans();


                const updatedLoan =
                    loans.find(
                        item =>
                            Number(item.id) ===
                            Number(selectedLoan.id)
                    );


                if (updatedLoan) {

                    selectedLoan =
                        updatedLoan;


                    if (modalBorrowerName) {

                        modalBorrowerName.textContent =
                            updatedLoan.borrowerName;
                    }


                    if (modalLoanAmount) {

                        modalLoanAmount.textContent =
                            formatMoney(
                                updatedLoan.loanAmount
                            );
                    }


                    if (modalRepayAmount) {

                        modalRepayAmount.textContent =
                            formatMoney(
                                updatedLoan.repayAmount
                            );
                    }


                    if (modalTotalPaid) {

                        modalTotalPaid.textContent =
                            formatMoney(
                                getTotalPaid(
                                    updatedLoan
                                )
                            );
                    }


                    if (modalTotalPenalty) {

                        modalTotalPenalty.textContent =
                            formatMoney(
                                getTotalPenalty(
                                    updatedLoan
                                )
                            );
                    }


                    if (modalBalance) {

                        modalBalance.textContent =
                            formatMoney(
                                getBalance(
                                    updatedLoan
                                )
                            );
                    }


                    displayRepaymentHistory(
                        updatedLoan
                    );
                }

            } catch (error) {

                console.error(
                    "Unexpected repayment error:",
                    error
                );

                alert(
                    "An unexpected error occurred."
                );
            }
        }
    );
}


/* =========================================================
   DELETE REPAYMENT
   ========================================================= */

async function deleteRepayment(
    repaymentId
) {

    if (!isAdminLoggedIn) {

        alert(
            "Only an administrator can delete repayment records."
        );

        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this payment/penalty record?"
        );


    if (!confirmed) {

        return;
    }


    try {

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
                "Unable to delete repayment record: " +
                error.message
            );

            return;
        }


        alert(
            "Payment/penalty record deleted successfully."
        );


        await loadLoans();


        if (selectedLoan) {

            const updatedLoan =
                loans.find(
                    item =>
                        Number(item.id) ===
                        Number(
                            selectedLoan.id
                        )
                );


            if (updatedLoan) {

                selectedLoan =
                    updatedLoan;


                if (modalTotalPaid) {

                    modalTotalPaid.textContent =
                        formatMoney(
                            getTotalPaid(
                                updatedLoan
                            )
                        );
                }


                if (modalTotalPenalty) {

                    modalTotalPenalty.textContent =
                        formatMoney(
                            getTotalPenalty(
                                updatedLoan
                            )
                        );
                }


                if (modalBalance) {

                    modalBalance.textContent =
                        formatMoney(
                            getBalance(
                                updatedLoan
                            )
                        );
                }


                displayRepaymentHistory(
                    updatedLoan
                );
            }
        }

    } catch (error) {

        console.error(
            "Unexpected delete repayment error:",
            error
        );

        alert(
            "An unexpected error occurred."
        );
    }
}


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
   ========================================================= */

if (repaymentModal) {

    repaymentModal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                repaymentModal
            ) {

                closeRepaymentModal();
            }
        }
    );
}


/* =========================================================
   ESCAPE KEY CLOSES MODAL
   ========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape" &&
            repaymentModal &&
            repaymentModal.style.display ===
                "flex"
        ) {

            closeRepaymentModal();
        }
    }
);


/* =========================================================
   INITIALIZE APPLICATION
   ========================================================= */

async function initializeApp() {

    try {

        await checkAdminStatus();

        await loadLoans();

    } catch (error) {

        console.error(
            "Application initialization error:",
            error
        );
    }
}


initializeApp();

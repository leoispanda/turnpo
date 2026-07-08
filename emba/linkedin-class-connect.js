    (function guardEmbaTool() {
      const hasUiCookie = document.cookie.split(";").some((cookie) => cookie.trim() === "turnpo_emba_ui=granted");
      let hasSessionAccess = false;
      try {
        hasSessionAccess = sessionStorage.getItem("turnpo:emba-access") === "granted";
      } catch {
        hasSessionAccess = false;
      }
      if (!hasUiCookie && !hasSessionAccess) {
        document.documentElement.classList.add("needs-emba-access");
      }
    })();

    const people = [
      { number: 1, name: "Ammar Alzoubi", first: "Ammar", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/ammar-alzoubi-23519a261/" },
      { number: 2, name: "Andre den Boer", first: "Andre", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/andredenboer78" },
      { number: 3, name: "Wilfried Bolt", first: "Wilfried", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/wilfriedbolt" },
      { number: 4, name: "Martina Bordin", first: "Martina", source: "Corporate Finance + Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Martina%20Bordin%20Dentsply%20Sirona", reason: "Text in first list, not a URL; duplicate in Intro B" },
      { number: 5, name: "Mitchell Duin", first: "Mitchell", source: "Corporate Finance + Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Mitchell%20Duin%20Maastricht%20University", reason: "No URL in first list; duplicate in Intro B" },
      { number: 6, name: "Daniela Fellmann", first: "Daniela", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/daniela-fellmann/" },
      { number: 7, name: "Steffy Greijmans", first: "Steffy", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/steffy-greijmans-5b1209b7/" },
      { number: 8, name: "Yi-Ju Huang", first: "Yi-Ju", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/yi-ju-huang-80697156/" },
      { number: 9, name: "Jan de Jonge", first: "Jan", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/jmdejonge/" },
      { number: 10, name: "Mariaan Kempen", first: "Mariaan", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/mariaan-kempen" },
      { number: 11, name: "Armand Kerckhoffs", first: "Armand", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/armand-kerckhoffs-1745b828/" },
      { number: 12, name: "Jeroen Kieboom", first: "Jeroen", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/jeroen-kieboom-0039a135/" },
      { number: 13, name: "Danny Kokol", first: "Danny", source: "Corporate Finance + Intro B", status: "direct", url: "https://www.linkedin.com/in/danny-kokol-661aa520/" },
      { number: 14, name: "Guido Koopmann", first: "Guido", source: "Corporate Finance + Intro B", status: "direct", url: "https://www.linkedin.com/in/guidokoopmann" },
      { number: 15, name: "Nandika Menuwarage", first: "Nandika", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/menuwarage" },
      { number: 16, name: "Rik Moonen", first: "Rik", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/rikmoonen/" },
      { number: 17, name: "Birgitta Nielsen", first: "Birgitta", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/birgitta-nielsen-98bb31b/" },
      { number: 18, name: "Yves Salentiny", first: "Yves", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/yves-salentiny-310428201/" },
      { number: 19, name: "Dmitrii Semenov", first: "Dmitrii", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/dmitrii-semenov-12147a2b8/" },
      { number: 20, name: "Lisette Sijben", first: "Lisette", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/lisette-sijben-habets/" },
      { number: 21, name: "Angeliki Steka", first: "Angeliki", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/angeliki-steka-5038a812a/" },
      { number: 22, name: "Andrew Thiher", first: "Andrew", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/andrew-thiher/" },
      { number: 23, name: "Karel Turkstra", first: "Karel", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/karelturkstra/" },
      { number: 24, name: "Marco Uccelli", first: "Marco", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/uccellimarco/" },
      { number: 25, name: "Patricia Vermeer", first: "Patricia", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/patricia-v-74a2297a/" },
      { number: 26, name: "Angela Vlassopoulou", first: "Angela", source: "Corporate Finance", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Angela%20Vlassopoulou%20Maastricht%20University", reason: "No URL in first list" },
      { number: 27, name: "Fernand de Vries", first: "Fernand", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/fernand-de-vries/" },
      { number: 28, name: "Steven Willems", first: "Steven", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/steven-willems-99b00134/" },
      { number: 29, name: "Jonathan Zart", first: "Jonathan", source: "Corporate Finance", status: "direct", url: "https://www.linkedin.com/in/jonathan-zart/" },
      { number: 30, name: "Dennis Verhoeven", first: "Dennis", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Dennis%20Verhoeven%20Maastricht%20University", reason: "Photo list only" },
      { number: 31, name: "Douglas Keijzer", first: "Douglas", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Douglas%20Keijzer%20Maastricht%20University", reason: "Photo list only" },
      { number: 32, name: "Bjorn van der Horst", first: "Bjorn", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Bjorn%20van%20der%20Horst%20Maastricht%20University", reason: "Photo list only" },
      { number: 33, name: "Tobias Weigand", first: "Tobias", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Tobias%20Weigand%20Maastricht%20University", reason: "Photo list only" },
      { number: 34, name: "Anna Oja", first: "Anna", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Anna%20Oja%20Maastricht%20University", reason: "Photo list only" },
      { number: 35, name: "Görkem Yildiz", first: "Görkem", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=G%C3%B6rkem%20Yildiz%20Maastricht%20University", reason: "Photo list only" },
      { number: 36, name: "Mirjam Beelen", first: "Mirjam", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Mirjam%20Beelen%20Maastricht%20University", reason: "Photo list only" },
      { number: 37, name: "Daniel Biegel", first: "Daniel", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Daniel%20Biegel%20Maastricht%20University", reason: "Photo list only" },
      { number: 38, name: "Tahmina Shafique", first: "Tahmina", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Tahmina%20Shafique%20Maastricht%20University", reason: "Photo list only" },
      { number: 39, name: "Kent Williams", first: "Kent", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Kent%20Williams%20Maastricht%20University", reason: "Photo list only" },
      { number: 40, name: "Adam Miszta", first: "Adam", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Adam%20Miszta%20Maastricht%20University", reason: "Photo list only" },
      { number: 41, name: "Stefan Tanas", first: "Stefan", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Stefan%20Tanas%20Maastricht%20University", reason: "Photo list only" },
      { number: 42, name: "Nikaila Naidoo", first: "Nikaila", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Nikaila%20Naidoo%20Maastricht%20University", reason: "Photo list only" },
      { number: 43, name: "Birthe Lueg", first: "Birthe", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Birthe%20Lueg%20Maastricht%20University", reason: "Photo list only" },
      { number: 44, name: "Fangran Voigt", first: "Fangran", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Fangran%20Voigt%20Maastricht%20University", reason: "Photo list only" },
      { number: 45, name: "Stefan Louw", first: "Stefan", source: "Intro A", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Stefan%20Louw%20Maastricht%20University", reason: "Photo list only" },
      { number: 46, name: "Maja Habets", first: "Maja", source: "Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Maja%20Habets%20Maastricht%20University", reason: "Photo list only" },
      { number: 47, name: "Sharona Verkleij", first: "Sharona", source: "Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Sharona%20Verkleij%20Maastricht%20University", reason: "Photo list only" },
      { number: 48, name: "Danny Veenstra", first: "Danny", source: "Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Danny%20Veenstra%20Maastricht%20University", reason: "Photo list only" },
      { number: 49, name: "Joost Saveniers", first: "Joost", source: "Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Joost%20Saveniers%20Maastricht%20University", reason: "Photo list only" },
      { number: 50, name: "Mark Rosenkranz", first: "Mark", source: "Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Mark%20Rosenkranz%20Maastricht%20University", reason: "Photo list only" },
      { number: 51, name: "Louis du Rieu", first: "Louis", source: "Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Louis%20du%20Rieu%20Maastricht%20University", reason: "Photo list only" },
      { number: 52, name: "Maurice Görges", first: "Maurice", source: "Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Maurice%20G%C3%B6rges%20Maastricht%20University", reason: "Photo list only" },
      { number: 53, name: "Michael Pielhau", first: "Michael", source: "Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Michael%20Pielhau%20Maastricht%20University", reason: "Photo list only" },
      { number: 54, name: "Thibault Maquet", first: "Thibault", source: "Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Thibault%20Maquet%20Maastricht%20University", reason: "Photo list only" },
      { number: 55, name: "Daan Stotijn", first: "Daan", source: "Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Daan%20Stotijn%20Maastricht%20University", reason: "Photo list only" },
      { number: 56, name: "Lenno Reimand", first: "Lenno", source: "Intro B", status: "lookup", search: "https://www.linkedin.com/search/results/people/?keywords=Lenno%20Reimand%20Maastricht%20University", reason: "Photo list only" }
    ];

    const storageKey = "july-2026-linkedin-helper-done-v1";
    const rows = document.querySelector("#rows");
    const emptyState = document.querySelector("#empty-state");
    const searchInput = document.querySelector("#search-input");
    const totalCount = document.querySelector("#total-count");
    const doneCount = document.querySelector("#done-count");
    const directCount = document.querySelector("#direct-count");
    const lookupCount = document.querySelector("#lookup-count");
    const toast = document.querySelector("#toast");
    let activeFilter = "all";
    let toastTimer;

    totalCount.textContent = people.length;
    directCount.textContent = people.filter((person) => person.status === "direct").length;
    lookupCount.textContent = people.filter((person) => person.status === "lookup").length;

    function inviteFor(person) {
      return `Hi ${person.first}, I am also in the Maastricht University July 2026 programme. I saw your name on the class list and would love to connect here. Looking forward to meeting you during the programme!`;
    }

    function listDetailFor(person) {
      const source = person.source || "classmate list";
      if (person.status === "direct") {
        return {
          text: `${source}. Direct LinkedIn profile captured from the detailed list.`,
          href: person.url,
          label: person.url
        };
      }
      return {
        text: `${source}. Manual LinkedIn lookup needed${person.reason ? `: ${person.reason}` : "."}`,
        href: person.search,
        label: "Prepared LinkedIn search"
      };
    }

    function listDetailText(person) {
      const detail = listDetailFor(person);
      return `${detail.text} ${detail.label || ""}`;
    }

    function listDetailHtml(person) {
      const detail = listDetailFor(person);
      return `
        <span class="detail-text">${detail.text}</span>
        ${detail.href ? `<a class="detail-link" href="${detail.href}" target="_blank" rel="noopener noreferrer">${detail.label}</a>` : ""}
      `;
    }

    function getDoneSet() {
      try {
        return new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));
      } catch {
        return new Set();
      }
    }

    function saveDoneSet(doneSet) {
      localStorage.setItem(storageKey, JSON.stringify([...doneSet]));
    }

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add("visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("visible"), 1700);
    }

    async function copyText(text, successMessage) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.append(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      showToast(successMessage);
    }

    function iconPath(type) {
      const icons = {
        open: '<path d="M14 3h7v7M21 3l-9 9M10 5H6.8C5.8 5 5 5.8 5 6.8v10.4c0 1 .8 1.8 1.8 1.8h10.4c1 0 1.8-.8 1.8-1.8V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
        copy: '<path d="M8 8V5.8C8 4.8 8.8 4 9.8 4h8.4c1 0 1.8.8 1.8 1.8v8.4c0 1-.8 1.8-1.8 1.8H16M5.8 8h8.4c1 0 1.8.8 1.8 1.8v8.4c0 1-.8 1.8-1.8 1.8H5.8c-1 0-1.8-.8-1.8-1.8V9.8c0-1 .8-1.8 1.8-1.8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
        search: '<path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
      };
      return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none">${icons[type]}</svg>`;
    }

    function renderRows() {
      const doneSet = getDoneSet();
      const query = searchInput.value.trim().toLowerCase();
      const filtered = people.filter((person) => {
        const searchable = `${person.name} ${person.source} ${listDetailText(person)}`.toLowerCase();
        const matchesQuery = !query || searchable.includes(query);
        const matchesFilter =
          activeFilter === "all" ||
          (activeFilter === "direct" && person.status === "direct") ||
          (activeFilter === "lookup" && person.status === "lookup") ||
          (activeFilter === "todo" && !doneSet.has(String(person.number)));
        return matchesQuery && matchesFilter;
      });

      rows.innerHTML = filtered.map((person) => {
        const done = doneSet.has(String(person.number));
        const target = person.url || person.search;
        const statusLabel = done ? "Done" : person.status === "direct" ? "Direct" : "Lookup";
        const openLabel = person.status === "direct" ? "Open" : "Search";
        const statusClass = done ? "done" : person.status;
        return `
          <tr class="${done ? "done" : ""}" data-number="${person.number}">
            <td class="num">${person.number}</td>
            <td><span class="name">${person.name}</span></td>
            <td><span class="source-label">${person.source}</span></td>
            <td class="note-preview">${listDetailHtml(person)}</td>
            <td><span class="pill ${statusClass}">${statusLabel}</span></td>
            <td>
              <div class="actions">
                <a class="button primary" href="${target}" target="_blank" rel="noopener noreferrer">${iconPath(person.status === "direct" ? "open" : "search")}${openLabel}</a>
                <button class="button ghost" type="button" data-copy-note="${person.number}">${iconPath("copy")}Copy note</button>
              </div>
            </td>
            <td class="note-preview">${inviteFor(person)}</td>
            <td>
              <label class="done-control">
                <input type="checkbox" data-done="${person.number}" ${done ? "checked" : ""}>
                Sent
              </label>
            </td>
          </tr>
        `;
      }).join("");

      doneCount.textContent = doneSet.size;
      emptyState.style.display = filtered.length ? "none" : "block";
    }

    document.addEventListener("click", (event) => {
      const copyButton = event.target.closest("[data-copy-note]");
      if (copyButton) {
        const person = people.find((item) => item.number === Number(copyButton.dataset.copyNote));
        copyText(inviteFor(person), `Copied note for ${person.first}`);
      }

      const segment = event.target.closest("[data-filter]");
      if (segment) {
        activeFilter = segment.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach((button) => {
          button.setAttribute("aria-pressed", String(button === segment));
        });
        renderRows();
      }
    });

    document.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-done]");
      if (!checkbox) return;
      const doneSet = getDoneSet();
      if (checkbox.checked) {
        doneSet.add(checkbox.dataset.done);
      } else {
        doneSet.delete(checkbox.dataset.done);
      }
      saveDoneSet(doneSet);
      renderRows();
    });

    searchInput.addEventListener("input", renderRows);

    document.querySelector("#copy-direct").addEventListener("click", () => {
      const urls = people.filter((person) => person.status === "direct").map((person) => person.url).join("\n");
      copyText(urls, "Copied all direct LinkedIn URLs");
    });

    renderRows();

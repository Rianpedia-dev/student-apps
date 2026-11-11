import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavbarLiveClock, resolveSemesterDisplay } from "@/components/layouts/navbar-clock";
import { getAcademicYear } from "@/lib/utils";

describe("Navbar Semester Display", () => {
  it("resolves Semester 1 (Ganjil) for July-December academic year", () => {
    const augAcademic = getAcademicYear(new Date(2026, 10, 11)); // Nov 11, 2026
    const result = resolveSemesterDisplay(augAcademic);

    expect(result).toEqual({
      tahunPelajaran: "2026/2027",
      semesterNum: 1,
      semesterLabel: "Semester 1",
      semesterPeriod: "Ganjil",
    });
  });

  it("resolves Semester 2 (Genap) for January-June academic year", () => {
    const marAcademic = getAcademicYear(new Date(2027, 2, 10)); // Mar 10, 2027
    const result = resolveSemesterDisplay(marAcademic);

    expect(result).toEqual({
      tahunPelajaran: "2026/2027",
      semesterNum: 2,
      semesterLabel: "Semester 2",
      semesterPeriod: "Genap",
    });
  });

  it("infers semesterNum from string semester label when semesterNum is omitted", () => {
    expect(
      resolveSemesterDisplay({ tahunPelajaran: "2025/2026", semester: "Semester 2" })
    ).toEqual({
      tahunPelajaran: "2025/2026",
      semesterNum: 2,
      semesterLabel: "Semester 2",
      semesterPeriod: "Genap",
    });

    expect(
      resolveSemesterDisplay({ tahunPelajaran: "2026/2027", semester: "Genap" })
    ).toEqual({
      tahunPelajaran: "2026/2027",
      semesterNum: 2,
      semesterLabel: "Semester 2",
      semesterPeriod: "Genap",
    });
  });

  it("renders running semester instead of live clock in NavbarLiveClock", () => {
    const htmlSem1 = renderToStaticMarkup(
      <NavbarLiveClock
        academic={{ tahunPelajaran: "2026/2027", semester: "Semester 1", semesterNum: 1 }}
      />
    );
    expect(htmlSem1).toContain("TP 2026/2027");
    expect(htmlSem1).toContain("Semester 1");
    expect(htmlSem1).toContain("Ganjil");
    expect(htmlSem1).not.toContain("WIB");

    const htmlSem2 = renderToStaticMarkup(
      <NavbarLiveClock
        academic={{ tahunPelajaran: "2026/2027", semester: "Semester 2", semesterNum: 2 }}
      />
    );
    expect(htmlSem2).toContain("TP 2026/2027");
    expect(htmlSem2).toContain("Semester 2");
    expect(htmlSem2).toContain("Genap");
    expect(htmlSem2).not.toContain("WIB");
  });
});


/**
 * Test data generators for unit and property-based testing
 */

import {
  Language,
  Gender,
  FamilyRelation,
  IncomeCategory,
  HousingType,
} from "../../src/types";

export class TestDataGenerators {
  /**
   * Generate a valid session ID
   */
  static sessionId(): string {
    const chars = "abcdef0123456789";
    const segments = [8, 4, 4, 4, 12];
    return segments
      .map((len) =>
        Array.from(
          { length: len },
          () => chars[Math.floor(Math.random() * chars.length)],
        ).join(""),
      )
      .join("-");
  }

  /**
   * Generate multilingual text
   */
  static multilangText(language: Language = Language.ENGLISH): string {
    const englishWords = [
      "hello",
      "help",
      "scheme",
      "eligibility",
      "complaint",
      "hospital",
      "doctor",
      "medicine",
    ];
    const hindiWords = [
      "नमस्ते",
      "सहायता",
      "योजना",
      "योग्यता",
      "शिकायत",
      "अस्पताल",
      "डॉक्टर",
      "दवा",
    ];

    const words = language === Language.HINDI ? hindiWords : englishWords;
    const length = Math.floor(Math.random() * 10) + 3;

    return Array.from(
      { length },
      () => words[Math.floor(Math.random() * words.length)],
    ).join(" ");
  }

  /**
   * Generate a valid Indian address
   */
  static indianAddress() {
    const districts = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"];
    const states = [
      "Maharashtra",
      "Delhi",
      "Karnataka",
      "Tamil Nadu",
      "West Bengal",
    ];

    return {
      district: districts[Math.floor(Math.random() * districts.length)],
      state: states[Math.floor(Math.random() * states.length)],
      pincode: String(Math.floor(Math.random() * 900000) + 100000),
      village:
        Math.random() > 0.5
          ? `Village${Math.floor(Math.random() * 100)}`
          : undefined,
    };
  }

  /**
   * Generate household information
   */
  static householdInfo() {
    const genders = [Gender.MALE, Gender.FEMALE];
    const incomeCategories = [
      IncomeCategory.BPL,
      IncomeCategory.APL,
      IncomeCategory.SECC_ELIGIBLE,
    ];
    const housingTypes = [
      HousingType.KUTCHA,
      HousingType.SEMI_PUCCA,
      HousingType.PUCCA,
    ];

    const memberCount = Math.floor(Math.random() * 6) + 1;
    const members = Array.from({ length: memberCount }, (_, i) => ({
      name: `Person${i + 1}`,
      age: Math.floor(Math.random() * 80) + 1,
      gender: genders[Math.floor(Math.random() * genders.length)],
      relation: i === 0 ? FamilyRelation.HEAD : FamilyRelation.CHILD,
    }));

    return {
      headOfHousehold: members[0],
      members: members.slice(1),
      address: this.indianAddress(),
      economicStatus: {
        incomeCategory:
          incomeCategories[Math.floor(Math.random() * incomeCategories.length)],
        housingType:
          housingTypes[Math.floor(Math.random() * housingTypes.length)],
        assets: [],
      },
      existingSchemes: [],
    };
  }

  /**
   * Generate audio buffer (mock)
   */
  static audioBuffer(sizeKB: number = 100): Buffer {
    const size = sizeKB * 1024;
    const buffer = Buffer.alloc(size);
    // Add WAV header for format validation
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(size - 8, 4);
    buffer.write("WAVE", 8);
    return buffer;
  }

  /**
   * Generate image buffer (mock)
   */
  static imageBuffer(sizeKB: number = 500): Buffer {
    const size = sizeKB * 1024;
    const buffer = Buffer.alloc(size);
    // Add JPEG header for format validation
    buffer[0] = 0xff;
    buffer[1] = 0xd8;
    buffer[2] = 0xff;
    return buffer;
  }
}

import type { VolunteerApplicationItem } from "@/types";

export const mockVolunteerApplications: VolunteerApplicationItem[] = [
  {
    requestId: "va-00000001-1111-4000-a000-000000000001",
    volunteerId: "acc-00000004-4444-4000-a000-000000000004",
    documentUrl: "https://storage.example.com/docs/nic-front-001.jpg",
    status: "pending",
    adminNotes: null,
    submittedAt: "2026-03-13T10:00:00Z",
    reviewedAt: null,
    volunteer: {
      name: "Tharushi Bandara",
      email: "tharushi.b@example.com",
      volunteerProfile: {
        instituteName: "University of Colombo",
        bio: "Third-year psychology student passionate about mental health support. I've volunteered at Sumithrayo helpline for over a year and completed a certificate in crisis intervention.",
      },
    },
  },
  {
    requestId: "va-00000002-2222-4000-a000-000000000002",
    volunteerId: "acc-00000005-5555-4000-a000-000000000005",
    documentUrl: "https://storage.example.com/docs/nic-front-002.jpg",
    status: "pending",
    adminNotes: null,
    submittedAt: "2026-03-12T15:30:00Z",
    reviewedAt: null,
    volunteer: {
      name: "Ashan Rajapaksha",
      email: "ashan.r@example.com",
      volunteerProfile: {
        instituteName: "University of Moratuwa",
        bio: "Final-year IT student. I want to give back to the community by being a listener. I have experience in peer counseling through the university welfare society.",
      },
    },
  },
  {
    requestId: "va-00000003-3333-4000-a000-000000000003",
    volunteerId: "acc-00000007-7777-4000-a000-000000000007",
    documentUrl: "https://storage.example.com/docs/nic-front-003.pdf",
    status: "pending",
    adminNotes: null,
    submittedAt: "2026-03-14T08:20:00Z",
    reviewedAt: null,
    volunteer: {
      name: "Nethmi Wickramasinghe",
      email: "nethmi.w@example.com",
      volunteerProfile: {
        instituteName: "University of Peradeniya",
        bio: "Second-year social work student with a genuine interest in helping others navigate difficult emotions. Completed mental health first aid training.",
      },
    },
  },
  {
    requestId: "va-00000004-4444-4000-a000-000000000004",
    volunteerId: "acc-00000008-8888-4000-a000-000000000008",
    documentUrl: "https://storage.example.com/docs/nic-front-004.jpg",
    status: "approved",
    adminNotes: "All documents verified. Institute confirmed.",
    submittedAt: "2026-03-05T09:00:00Z",
    reviewedAt: "2026-03-06T14:00:00Z",
    volunteer: {
      name: "Kasun Dissanayake",
      email: "kasun.d@example.com",
      volunteerProfile: {
        instituteName: "University of Kelaniya",
        bio: "Fourth-year counseling psychology student. Active member of the university peer support program for two years.",
      },
    },
  },
  {
    requestId: "va-00000005-5555-4000-a000-000000000005",
    volunteerId: "acc-0000000b-bbbb-4000-a000-00000000000b",
    documentUrl: "https://storage.example.com/docs/nic-front-005.jpg",
    status: "approved",
    adminNotes: "Valid NIC. University enrollment verified.",
    submittedAt: "2026-03-02T11:45:00Z",
    reviewedAt: "2026-03-03T10:00:00Z",
    volunteer: {
      name: "Imalsha Gunawardena",
      email: "imalsha.g@example.com",
      volunteerProfile: {
        instituteName: "SLIIT",
        bio: "Software engineering student who wants to combine tech skills with empathy. Previously volunteered at a local elder care home.",
      },
    },
  },
  {
    requestId: "va-00000006-6666-4000-a000-000000000006",
    volunteerId: "acc-00000009-9999-4000-a000-000000000009",
    documentUrl: "https://storage.example.com/docs/nic-front-006.jpg",
    status: "rejected",
    adminNotes:
      "Document was blurry and unreadable. Please resubmit with a clearer photo of the NIC.",
    submittedAt: "2026-03-01T16:00:00Z",
    reviewedAt: "2026-03-02T09:30:00Z",
    volunteer: {
      name: "Dineth Pathirana",
      email: "dineth.p@example.com",
      volunteerProfile: {
        instituteName: "NSBM Green University",
        bio: "Interested in helping people through difficult times. Currently studying business management.",
      },
    },
  },
  {
    requestId: "va-00000007-7777-4000-a000-000000000007",
    volunteerId: "acc-0000000a-aaaa-4000-a000-00000000000a",
    documentUrl: "https://storage.example.com/docs/nic-front-007.jpg",
    status: "rejected",
    adminNotes:
      "Applicant does not meet the minimum age requirement. NIC indicates age below 18.",
    submittedAt: "2026-02-28T12:00:00Z",
    reviewedAt: "2026-03-01T08:00:00Z",
    volunteer: {
      name: "Sandun Perera",
      email: "sandun.p@example.com",
      volunteerProfile: null,
    },
  },
  {
    requestId: "va-00000008-8888-4000-a000-000000000008",
    volunteerId: "acc-00000006-6666-4000-a000-000000000006",
    documentUrl: "https://storage.example.com/docs/nic-front-008.pdf",
    status: "pending",
    adminNotes: null,
    submittedAt: "2026-03-14T07:10:00Z",
    reviewedAt: null,
    volunteer: {
      name: "Kaveesha Fernando",
      email: "kaveesha.f@example.com",
      volunteerProfile: {
        instituteName: "University of Jaffna",
        bio: "Bilingual (Sinhala/Tamil) student studying psychology. Eager to support people from diverse backgrounds.",
      },
    },
  },
];

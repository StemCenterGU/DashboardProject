import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'

const DEFAULT_QUESTIONS = [
  {
    question_number: 1,
    question_text: 'Other than instructor list the full email addresses of all personnel you would like to receive confirmation of this appointment (such as coaches and advisors)',
    possible_answers: null,
    is_required: false,
    visibility: 'Normal Visibility',
    send_to_staff: false,
    schedule_restrictions: [],
  },
  {
    question_number: 2,
    question_text: 'Course instructor',
    possible_answers: null,
    is_required: true,
    visibility: 'Normal Visibility',
    send_to_staff: true,
    schedule_restrictions: [],
  },
  {
    question_number: 3,
    question_text: 'Course',
    possible_answers: 'N/A,ACCT_313,ACCT_315,ACCT_320,ACCT_355,ACCT_365,ACCT_375,ACCT_420,ARABI_111,ARABI_112,ARCH_201,ARCH_202,ARCH_304,ARCH_390,ARCH_396,ARTS_101,ARTS_102,ARTS_103,ARTS_104,ARTS_105,ARTS_106,ARTS_111,ARTS_112,ARTS_140,ARTS_151,ARTS_152,ARTS_153,ARTS_154,ARTS_155,ARTS_156,ARTS_157,ARTS_158,ARTS_210,ARTS_212,ARTS_213,ARTS_232,ARTS_238,ARTS_239,ARTS_250,ARTS_253,ARTS_255,ARTS_256,ARTS_257,ARTS_259,ARTS_260,ARTS_345,ARTS_375,ARTS_376,ARTS_391,AT_100,AVBM_110,AVBM_111,AVBM_120,AVBM_121,AVBM_210,AVBM_211,AVBM_212,AVBM_311,AVBM_312,BCOR_105,BCOR_111,BCOR_112,BCOR_176,BCOR_214,BCOR_215,BCOR_220,BCOR_240,BCOR_241,BCOR_250,BCOR_276,BCOR_303,BCOR_311,BCOR_312,BCOR_375,BCOR_376,BCOR_440,BCOR_476,BCOR_480,BIOL_103,BIOL_104,BIOL_106,BIOL_107,BIOL_115,BIOL_116,BIOL_117,BIOL_118,BIOL_122,BIOL_123,BIOL_124,BIOL_125,BIOL_126,BIOL_127,BIOL_140,BIOL_223,BIOL_224,BIOL_232,BIOL_265,BIOL_266,BIOL_292,BIOL_293,BIOL_298,BIOL_299,BIOL_323,BIOL_324,BIOL_325,BIOL_326,BIOL_331,BIOL_332,BIOL_338,BIOL_339,BIOL_350,BIOL_354,BIOL_355,BIOL_365,BIOL_366,BIOL_368,BIOL_369,BIOL_373,BIOL_374,BIOL_375,BIOL_376,BIOL_378,BIOL_379,BIOL_380,BIOL_383,BIOL_384,BIOL_487,BIOL_488,BIOL_489,BIOL_492,BIOL_493,BIOL_494,BIOL_497,BIOL_498,BME_307,BME_308,BME_310,BME_354,BME_430,BME_462,BME_465,BME_480,BME_491,BME_493,CHEM_105,CHEM_106,CHEM_107,CHEM_108,CHEM_111,CHEM_112,CHEM_114,CHEM_115,CHEM_221,CHEM_222,CHEM_224,CHEM_225,CHEM_334,CHEM_335,CHEM_336,CHEM_337,CHEM_338,CHEM_356,CHEM_360,CHEM_366,CHEM_381,CHEM_383,CHEM_400,CHEM_408,CHEM_409,CHEM_418,CHEM_419,CIS_150,CIS_180,CIS_181,CIS_182,CIS_183,CIS_195,CIS_219,CIS_240,CIS_250,CIS_252,CIS_255,CIS_290,CIS_302,CIS_305,CIS_350,CIS_375,CIS_377,CIS_390,CIS_391,CIS_393,CIS_394,CIS_395,CIS_396,CIS_400,CIS_458,COMM_101,COMM_162,COMM_211,COMM_216,COMM_218,COMM_219,COMM_230,COMM_235,COMM_241,COMM_248,COMM_262,COMM_313,COMM_330,COMM_342,COMM_356,COMM_359,COMM_362,COMM_365,COMM_375,COMM_389,COMM_394,COMM_400,COMM_402,COMM_462,COMM_490,COMM_491,CRJS_101,CRJS_110,CRJS_201,CRJS_202,CRJS_205,CRJS_241,CRJS_261,CRJS_303,CRJS_310,CRJS_320,CRJS_341,CRJS_345,CRJS_350,CRJS_352,CRJS_361,CRJS_362,CRJS_367,CRJS_390,CRJS_391,CRJS_490,CRJS_492,CRJS_495,CSC_223,CSD_305,CSD_308,CSD_312,CSD_315,CSD_418,CSD_425,CSD_428,CYENG_220,CYENG_225,CYENG_350,CYSEC_101,CYSEC_212,CYSEC_302,CYSEC_303,CYSEC_307,DIET_202,ECE_111,ECE_140,ECE_141,ECE_228,ECE_229,ECE_238,ECE_239,ECE_327,ECE_328,ECE_330,ECE_331,ECE_337,ECE_347,ECE_351,ECE_355,ECE_358,ECE_380,ECE_391,ECE_394,ECE_396,ECE_467,ECE_468,ECE_475,ECE_483,ECE_492,ECE_493,ECE_495,ECE_497,ECED_202,ECED_308,ECON_311,ECON_312,ECON_325,ECON_375,ECON_427,ECON_431,ECON_441,ECON_443,EDCR_103,EDCR_105,EDCR_106,EDCR_220,EDCR_302,EDCR_320,EDCR_330,EDCR_341,EDCR_401,EDCR_419,EDCR_420,EDCR_424,EDCR_425,EDFL_101,EDFL_102,EDFL_103,EDFL_410,EDUC_358,EDUC_359,EDUC_390,EDUC_391,ELOCCT_213,ELOCCT_461,ENG_102,ENG_298,ENG_380,ENG_398,ENG_399,ENG_498,ENGL_101,ENGL_200,ENGL_212,ENGL_222,ENGL_231,ENGL_232,ENGL_253,ENGL_254,ENGL_262,ENGL_272,ENGL_273,ENGL_274,ENGL_275,ENGL_312,ENGL_313,ENGL_314,ENGL_315,ENGL_318,ENGL_331,ENGL_336,ENGL_337,ENGL_345,ENGL_352,ENGL_355,ENGL_362,ENGL_363,ENGL_373,ENGL_375,ENGL_380,ENGL_390,ENGL_394,ENTR_330,ENTR_375,ENV_121,ENV_212,ENV_220,ENV_307,ENV_312,ENV_313,ENV_336,ENV_337,ENV_420,ENV_440,ENV_444,ENV_449,ENV_455,ENV_465,ENV_477,ENV_495,ENV_497,ENV_498,ESL_020,ESL_021,ESL_023,ESL_024,ESL_030,ESL_031,ESL_033,ESL_034,ESL_040,ESL_041,ESL_043,ESL_044,ESL_050,ESL_051,ESL_053,ESL_054,ESL_060,ESL_061,ESL_063,ESL_064,ESL_070,ESL_071,ESL_073,ESL_074,ESL_080,ESL_086,ESL_087,ESL_092,ESL_093,FINC_312,FINC_313,FINC_318,FINC_330,FINC_332,FINC_375,FINC_450,FINC_499,FREN_112,FREN_211,FREN_390,FRSC_410,FRSH_030,GANNON_101,GEOG_201,GERO_375,GERO_400,GLBCIT_220,GLBCIT_221,GLOBL_283,GLOBL_285,GLOBL_290,GLOBL_333,GLOBL_372,GLOBL_374,GLOBL_399,GRMN_112,GRMN_211,GRMN_316,HCMG_340,HCMG_375,HCMG_410,HCMG_461,HIST_109,HIST_110,HIST_202,HIST_203,HIST_208,HIST_222,HIST_241,HIST_262,HIST_265,HIST_282,HIST_286,HIST_300,HIST_333,HIST_352,HIST_368,HIST_390,HIST_391,HIST_400,HLS_350,HLS_355,HNRS_102,HNRS_490,IE_201,IE_310,IE_320,IE_322,IE_350,IE_420,IE_425,IE_430,IE_435,IE_450,IE_465,IE_475,IE_488,IE_491,IE_493,IE_495,IMGT_306,IMGT_375,IMGT_420,IMGT_490,INTEL_101,INTEL_201,INTEL_203,INTEL_303,INTEL_341,INTEL_351,INTEL_490,IS_336,IS_337,IS_460,LATN_112,LATN_122,LBST_383,LEGL_111,LEGL_212,LEGL_336,LEGL_345,LEGL_390,LEGL_392,LEGL_393,LEGL_495,LENG_112,LENG_243,LHES_240,LHPS_240,LIBR_112,LIBR_113,LIBR_114,MATH_101,MATH_105,MATH_111,MATH_112,MATH_115,MATH_140,MATH_141,MATH_213,MATH_222,MATH_223,MATH_242,MATH_243,MATH_252,MATH_260,MATH_304,MATH_308,MATH_310,MATH_313,MATH_314,MATH_325,MATH_375,MATH_380,MATH_395,MDFL_294,MDTC_400,ME_201,ME_204,ME_207,ME_208,ME_212,ME_214,ME_215,ME_312,ME_327,ME_330,ME_332,ME_337,ME_338,ME_354,ME_360,ME_403,ME_405,ME_407,ME_411,ME_427,ME_444,ME_461,ME_463,ME_464,MGMT_305,MGMT_315,MGMT_330,MGMT_340,MGMT_350,MGMT_360,MGMT_375,MGMT_380,MGMT_399,MIC_201,MIC_205,MIC_301,MIC_305,MIC_310,MIC_401,MKTG_320,MKTG_325,MKTG_330,MKTG_375,MKTG_399,MKTG_420,MLED_202,MLED_303,MLED_304,MLTS_102,MLTS_104,MLTS_202,MLTS_204,MLTS_302,MLTS_304,MLTS_402,MLTS_404,MORT_390,NHP_400,NHP_410,NURS_204,NURS_205,NURS_206,NURS_207,NURS_302,NURS_308,NURS_309,NURS_310,NURS_311,NURS_312,NURS_313,NURS_320,NURS_343,NURS_404,NURS_406,NURS_407,NURS_414,NURS_415,NURS_416,NURS_419,NURS_420,NURS_428,NURS_435,NUTR_430,NUTR_450,OCCT_213,OCCT_461,PHAS_121,PHAS_312,PHAS_315,PHAS_363,PHAS_408,PHAS_415,PHAS_416,PHAS_425,PHAS_432,PHAS_438,PHAS_445,PHIL_101,PHIL_210,PHIL_225,PHIL_233,PHIL_237,PHIL_239,PHIL_244,PHIL_246,PHIL_248,PHIL_260,PHIL_272,PHIL_273,PHIL_274,PHIL_286,PHIL_365,PHYS_101,PHYS_102,PHYS_105,PHYS_106,PHYS_108,PHYS_109,PHYS_210,PHYS_211,PHYS_212,PHYS_213,PHYS_214,PHYS_218,PLAW_357,POLI_111,POLI_122,POLI_133,POLI_220,POLI_283,POLI_343,POLI_346,POLI_350,POLI_360,POLI_390,PPRO_291,PRFEL_350,PSGA_350,PSGA_390,PSGA_400,PSYC_111,PSYC_211,PSYC_212,PSYC_222,PSYC_225,PSYC_232,PSYC_234,PSYC_260,PSYC_263,PSYC_265,PSYC_276,PSYC_292,PSYC_304,PSYC_311,PSYC_313,PSYC_315,PSYC_316,PSYC_319,PSYC_340,PSYC_382,PSYC_390,PSYC_391,PSYC_392,PSYC_393,PSYC_394,PSYC_395,PSYC_400,PT_100,PUBH_200,PUBH_310,PUBH_418,RADS_120,RADS_204,RADS_205,RADS_206,RADS_214,RADS_215,RADS_224,RADS_225,RADS_226,RADS_240,RADS_252,RADS_271,RADS_285,RADS_286,RADS_497,RADS_498,RISK_321,RISK_325,RISK_375,RISK_415,RISK_425,RISK_430,RISK_499,RSPC_201,RSPC_302,RSPC_350,RSPC_385,RSPC_404,RSPC_421,SCMG_310,SCMG_415,SCMG_425,SCMG_450,SCWK_212,SCWK_220,SCWK_222,SCWK_362,SCWK_363,SCWK_380,SCWK_401,SCWK_491,SEECS_102,SEECS_202,SEECS_302,SEECS_402,SMGT_315,SMGT_340,SMGT_349,SMGT_375,SMGT_381,SMGT_450,SMGT_460,SMGT_480,SOCI_110,SOCI_120,SOCI_390,SOFT_210,SOFT_310,SOFT_320,SPAN_111,SPAN_112,SPAN_211,SPAN_235,SPAN_313,SPAN_314,SPAN_351,SPAN_399,SPCH_111,SPED_101,SPED_220,SPED_320,SPED_322,SPED_340,SPED_343,SPRT_130,SPRT_240,SPRT_250,SPRT_270,SPRT_280,SPRT_340,SPRT_360,SPRT_361,SPRT_385,SPRT_390,SPRT_391,SPRT_415,SPRT_416,SPRT_420,SPRT_425,SPRT_430,SPRT_450,SPRT_470,SPRT_490,THEO_101,THEO_211,THEO_225,THEO_233,THEO_235,THEO_241,THEO_242,THEO_252,THEO_254,THEO_260,THEO_265,THEO_271,THEO_281,THEO_287,THEO_291,THEO_292,THEO_391,UPMC_001,WMST_201',
    is_required: true,
    visibility: 'Normal Visibility',
    send_to_staff: false,
    schedule_restrictions: [],
  },
  {
    question_number: 4,
    question_text: 'Academic Integrity',
    possible_answers: 'CHECKBOX,I affirm that I am not attempting to directly or indirectly get help with an online exam (or similar assessment) after it has been opened and its content is visible to me or others.',
    is_required: true,
    visibility: 'Normal Visibility',
    send_to_staff: false,
    schedule_restrictions: [],
  },
  {
    question_number: 5,
    question_text: 'Confidentiality',
    possible_answers: 'CHECKBOX,I understand that the academic material I go over with the tutor may be shared with my course instructor in order to help maintain academic integrity. Appointments cannot be strictly confidential at this time.',
    is_required: true,
    visibility: 'Normal Visibility',
    send_to_staff: false,
    schedule_restrictions: [],
  },
  {
    question_number: 6,
    question_text: 'Purpose(s) of appointment',
    possible_answers: 'CHECKBOX,Orientation,Complete homework (or other assessment),Study for quiz/test/exam/gateway,Go over class lecture/notes,Prepare for future class lectures,Other',
    is_required: true,
    visibility: 'Normal Visibility',
    send_to_staff: true,
    schedule_restrictions: [],
  },
  {
    question_number: 7,
    question_text: 'Purpose(s) of appointment',
    possible_answers: 'CHECKBOX,Email/Email Signature,Annotated Bibliography,Research Proposal,Critique,Research Paper,Letter,Review,Memoir,Thesis,Outline,Rhetorical Analysis,Profile,Business Plan,Cover Letter,Resume,Conversation Partner,Paper,Sanner Presentation Studio,Other',
    is_required: true,
    visibility: 'Normal Visibility',
    send_to_staff: true,
    schedule_restrictions: [],
  },
  {
    question_number: 8,
    question_text: 'How long is your paper?',
    possible_answers: 'CHECKBOX,4 Pages or Less (30 minutes recommended),5 Pages or More (1 hour recommended),Online (1 hour recommended)',
    is_required: true,
    visibility: 'Normal Visibility',
    send_to_staff: true,
    schedule_restrictions: [],
  },
  {
    question_number: 9,
    question_text: 'If this is an online appointment and you need a tutor to review your written work, can you take pictures and attach them to this form as a file?',
    possible_answers: 'Yes (Tip: If your work is by hand we recommend using a free app such as GeniusScan (https://thegrizzlylabs.com/genius-scan) to take pictures and automatically convert to a single PDF file.)',
    is_required: false,
    visibility: 'Normal Visibility',
    send_to_staff: false,
    schedule_restrictions: [],
  },
  {
    question_number: 10,
    question_text: 'Are you bringing any classmates?  If so, list full names or their network IDs here.',
    possible_answers: null,
    is_required: false,
    visibility: 'Normal Visibility',
    send_to_staff: false,
    schedule_restrictions: [],
  },
  {
    question_number: 11,
    question_text: 'Brief notes/comments, such as the topic(s) you would like to work on or anything else you would like us to know about your appointment',
    possible_answers: 'TEXTAREA',
    is_required: true,
    visibility: 'Normal Visibility',
    send_to_staff: true,
    schedule_restrictions: [],
  },
  {
    question_number: 12,
    question_text: 'Is the course listed below EXACTLY the course you want to get help with?',
    possible_answers: 'Yes,No (if not--please do not schedule with this tutor; he or she will not be able to help!)',
    is_required: true,
    visibility: 'Normal Visibility',
    send_to_staff: false,
    schedule_restrictions: [],
  },
  {
    question_number: 13,
    question_text: 'Please describe any resources needed',
    possible_answers: 'CHECKBOX,Scribe,Computer,Reader',
    is_required: false,
    visibility: 'Normal Visibility',
    send_to_staff: false,
    schedule_restrictions: [],
  },
  {
    question_number: 14,
    question_text: 'I confirm I have not knowingly presented another\'s work, including text created by AI (e.g., ChatGPT), as my own. I may discuss correctly documenting sources to avoid any unintentional plagiarism.',
    possible_answers: 'Yes',
    is_required: true,
    visibility: 'Normal Visibility',
    send_to_staff: false,
    schedule_restrictions: [],
  },
  {
    question_number: 15,
    question_text: 'What best describes your exam?',
    possible_answers: 'Calculus 1 (MATH 140) Readiness Exam,Calculus 1 (MATH 140) Gateway Exam,Online College Algebra (MATH 111) Exam,Make-Up Exam For Another Gannon Course',
    is_required: true,
    visibility: 'Normal Visibility',
    send_to_staff: false,
    schedule_restrictions: [],
  },
]

export async function POST() {
  let user
  try {
    user = await requireAuth()
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Check permissions
    const userRole = user.role ?? ''
    if (!hasPermission(userRole, 'EDIT_SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if questions already exist
    const { data: existingQuestions, error: checkError } = await supabase
      .from('appointment_form_questions')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('Error checking existing questions:', checkError)
      return NextResponse.json({ error: 'Failed to check existing questions' }, { status: 500 })
    }

    if (existingQuestions && existingQuestions.length > 0) {
      return NextResponse.json(
        {
          error: 'Questions already exist. Please delete existing questions first or use this endpoint only on empty tables.',
          existing_count: existingQuestions.length
        },
        { status: 400 }
      )
    }

    // Insert default questions
    const { data, error } = await supabase
      .from('appointment_form_questions')
      .insert(DEFAULT_QUESTIONS)
      .select()

    if (error) {
      console.error('Error inserting default questions:', error)
      return NextResponse.json({ error: 'Failed to insert default questions' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Default questions populated successfully',
      count: data.length,
      questions: data,
    })
  } catch (error) {
    console.error('Error in populate-defaults:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Vinicius Betim - Dome
 */
define([], function () {

    return {

        API: {
            CNPJ_BASE_URL: 'https://brasilapi.com.br/api/cnpj/v1/',
            CEP_BASE_URL:  'https://brasilapi.com.br/api/cep/v2/'
        },

        ENTITY: {
            FIELDS: {
                COMPANY_NAME: 'legalname',
                TRADE_NAME:   'companyname',
                PHONE:        'phone',
                ALT_PHONE:    'altphone',
                FAX:          'fax',
                EMAIL:        'email',
                CNPJ:         'custentity_brl_entity_t_fed_tax_reg',
                TAX_REGIME:   'custentity_fte_entity_l_taxregime'
            },
            SUBLISTS: {
                ADDRESS: {
                    ID: 'addressbook',
                    SUBRECORD: {
                        ID: 'addressbookaddress',
                        FIELDS: {
                            ADDR1:      'addr1',
                            ADDR2:      'addr2',
                            ADDR3:      'addr3',
                            ZIP:        'zip',
                            CITY:       'custrecord_brl_addr_form_city',
                            STATE:      'state',
                            COUNTRY:    'country',
                            PHONE:      'addrphone',
                            COMPLEMENT: 'custrecord_brl_addrform_t_complement'
                        }
                    }
                }
            },
            CITY_LOOKUP: {
                RECORD_TYPE: 'customrecord_ftebr_city',
                FIELDS: {
                    IBGE_CODE: 'custrecord_ftebr_city_i_ibge_code'
                }
            },
            TAX_REGIME_LOOKUP: {
                RECORD_TYPE: 'customrecord_fte_taxregime',
                LABELS: {
                    SIMPLES:         'Optante pelo Simples Nacional',
                    LUCRO_PRESUMIDO: 'Lucro Presumido',
                    LUCRO_REAL:      'Lucro Real'
                }
            }
        },

        SCRIPTS: {
            CLIENT_SCRIPT_PATH: 'SuiteScripts/ProjectDome/pd-cnpj-integration/entry-points/pd-cnpj-integration-cl.js'
        },

        BUTTON: {
            ID:       'custpage_pd_fetch_cnpj_bt',
            LABEL:    'Consultar CNPJ',
            FUNCTION: 'fetchCNPJ'
        }

    };
});

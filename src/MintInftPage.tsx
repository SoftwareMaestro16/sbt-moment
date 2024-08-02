import React, { useEffect, useState } from 'react';
import './MintInftPage.css';
import { BackButton } from './BackButton';
import { MainButton } from './MainButton';
import { useParams } from 'react-router-dom';
import { Address, beginCell, Cell } from "@ton/core";
import { SendTransactionRequest, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import {getJettonWalletAddress} from "./tonapi.tsx";
import { INFT } from "./constants.ts";

interface Button {
  label: string;
  uri: string;
}

interface Attribute {
  trait_type: string;
  value: string;
}

interface FormData {
  name: string;
  description?: string; 
  image: string;
  content_url?: string; 
  buttons: Button[];
  attributes: Attribute[];
}

interface Errors {
  name?: string;
  image?: string;
  content_url?: string;
  [key: string]: string | undefined; 
}


const MintInftPage: React.FC = () => {
    const { friendlyAddress } = useParams<{ friendlyAddress: string }>();
    const [formData, setFormData] = useState<FormData>({
      name: '',
      image: '',
      buttons: [],
      attributes: []
    });
    const wallet = useTonWallet();
    const [tonConnectUi] = useTonConnectUI();
    const [, setTxInProgress] = useState(false);
    const [errors, setErrors] = useState<Errors>({});
    const [resultUrl, setResultUrl] = useState<string>('');
    const [uploadMessageVisible, setUploadMessageVisible] = useState<boolean>(false);
    
    useEffect(() => {
      if (friendlyAddress) {
        console.log('Friendly Address:', friendlyAddress);
      }
    }, [friendlyAddress]);

    useEffect(() => {
        if (resultUrl) {
          setUploadMessageVisible(true);
          const timer = setTimeout(() => setUploadMessageVisible(false), 2000); 
          return () => clearTimeout(timer); 
        }
      }, [resultUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>, index?: number, _field?: string, section?: 'buttons' | 'attributes') => {
    const { name, value } = e.target;
    setFormData(prevData => {
      const updatedData = { ...prevData };
      if (section && index !== undefined) {
        (updatedData[section] as any)[index][name as keyof Button | keyof Attribute] = value;
      } else {
        (updatedData as any)[name as keyof FormData] = value;
      }
      return updatedData;
    });
  };

  const addField = (section: 'buttons' | 'attributes') => {
    setFormData(prevData => ({
      ...prevData,
      [section]: [...prevData[section], section === 'buttons' ? { label: '', uri: '' } : { trait_type: '', value: '' }]
    }));
  };

  const removeField = (section: 'buttons' | 'attributes', index: number) => {
    setFormData(prevData => ({
      ...prevData,
      [section]: prevData[section].filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): Errors => {
    const errors: Errors = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.image || !/^https:\/\/.+/.test(formData.image)) errors.image = 'Valid image URL is required';
    if (formData.content_url && !/^https:\/\/.+\.(mp4|webm|ogg)$/.test(formData.content_url)) errors.content_url = 'Valid video URL is required';
    formData.buttons.forEach((btn, index) => {
      if (btn.uri && !/^https:\/\/.+/.test(btn.uri)) errors[`button_${index}_uri`] = 'Valid button URL is required';
    });
    formData.attributes.forEach((attr, index) => {
      if (attr.trait_type && !attr.value) errors[`attribute_${index}`] = 'All attributes must be filled';
    });
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const jsonData: any = {
      name: formData.name,
      image: formData.image,
    };

    if (formData.description) {
      jsonData.description = formData.description;
    }

    if (formData.content_url) {
      jsonData.content_url = formData.content_url;
    }

    const filteredButtons = formData.buttons.filter(btn => btn.label && btn.uri);
    if (filteredButtons.length > 0) {
      jsonData.buttons = filteredButtons;
    }

    const filteredAttributes = formData.attributes.filter(attr => attr.trait_type && attr.value);
    if (filteredAttributes.length > 0) {
      jsonData.attributes = filteredAttributes;
    }

    const jsonString = JSON.stringify(jsonData);

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2YzQ0MjFhMC1hMzJmLTQ1YzgtYTljOS0yYTRiZWI0MmJlYmYiLCJlbWFpbCI6ImRhbmlpbHNjaGVyYmFrb3YxMzM3QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI5NGFhMTA1YjVmNjAyYWRiOTFmZiIsInNjb3BlZEtleVNlY3JldCI6ImI3MTA1YzJhOGI5MDM3MGFmY2U0M2M2MzU5Njc0YzcxMzc3ODZkNmM1ZDM1NDcyZjM1MWEzZDBlY2NlZDAxNjEiLCJleHAiOjE3NTQwNjkzMTB9.D5MN0ejg39UT4kEWP8H9h1CumqPnayqtHNr6bf48qE4', // Replace with your actual API key
          'Content-Type': 'application/json'
        },
        body: jsonString
      });
      const result = await response.json();
      const ipfsHash = result.IpfsHash;
      const gatewayUrl = 'moccasin-recent-earthworm-890.mypinata.cloud'; 
      setResultUrl(`https://${gatewayUrl}/ipfs/${ipfsHash}`);
    } catch (error) {
      console.error('Error uploading JSON:', error);
    }
  };

  const onSendMintSbtSingle = async () => {
    if (!wallet) {
      console.error('Wallet is not connected');
      return;
    }

    if (!friendlyAddress) {
        console.error('Friendly address is not available');
        return;
    }

    setTxInProgress(true);

    try {
      const ownerAddress = Address.parse(friendlyAddress);
      const metaData = resultUrl;

      const jwAddress = await getJettonWalletAddress(INFT.toRawString(), wallet.account.address);
      const jwPayload = beginCell()
          .storeUint(0x0f8a7ea5, 32)
          .storeUint(0, 64)
          .storeCoins(300000000000)
          .storeAddress(Address.parse("UQAI6XfeQmLtZ8qzeoNWJRYG8wfuWQZBZHZF5-eUH7kDiZVN"))
          .storeAddress(null)
          .storeMaybeRef()
          .storeCoins(0)
          .storeMaybeRef()
          .endCell().toBoc().toString('base64');

        const data = beginCell()
            .storeAddress(ownerAddress)
            .storeAddress(ownerAddress)
            .storeRef(beginCell().storeUint(1,8).storeStringTail(metaData).endCell())
            .storeAddress(ownerAddress)
            .storeUint(0, 64)
        .endCell()

        const state = beginCell()
            .storeUint(6,5)
            .storeRef(Cell.fromBase64("te6cckECGQEABBgAART/APSkE/S88sgLAQIBYgISAgLOAw8CASAEDgHtDIhxwCSXwPg0NMD+kD6QDH6ADFx1yH6ADH6ADDwAgPTHwNxsI5MECRfBNMfghAFJMeuErqOOdM/MIAQ+EJwghDBjobSVQNtgEADyMsfEss/IW6zkwHPF5Ex4slxBcjLBVAEzxZY+gITy2rMyQH7AJEw4uAC0z+AFBPyCEC/LJqJSQLqOQDBsIjJwyMv/iwLPFoAQcIIQi3cXNUBVA4BAA8jLHxLLPyFus5MBzxeRMeLJcQXIywVQBM8WWPoCE8tqzMkB+wDgghDQw7/qUkC64wKCEATe0UhSQLrjAoIQHARBKlJAuo6FM0AD2zzgNDSCEBoLnVFSILoGBwgKAMBsM/pA1NMAMPhFcMjL/1AGzxb4Qs8WEswUyz9SMMsAA8MAlvhDUAPMAt6AEHixcIIQDdYH40A1FIBAA8jLHxLLPyFus5MBzxeRMeLJcQXIywVQBM8WWPoCE8tqzMkB+wAAyGwz+EJQA8cF8uGRAfpA1NMAMPhFcMjL//hCzxYTzBLLP1IQywABwwCU+EMBzN6AEHixcIIQBSTHrkBVA4BAA8jLHxLLPyFus5MBzxeRMeLJcQXIywVQBM8WWPoCE8tqzMkB+wAB9PhBFMcF8uGR+kAh8AH6QNIAMfoAggr68IAXoSGUUxWgod4i1wsBwwAgkgahkTbiIML/8uGSIY49yPhBzxZQB88WgBCCEFEaRGMTcSZUSFADyMsfEss/IW6zkwHPF5Ex4slxBcjLBVAEzxZY+gITy2rMyQH7AJI2MOIDCQCAjjYi8AGAEIIQ1TJ22xRFA21xA8jLHxLLPyFus5MBzxeRMeLJcQXIywVQBM8WWPoCE8tqzMkB+wCSbDHi+GHwAwP+jhAxMvhBEscF8uGa1DD4Y/AD4DKCEB8EU3pSELqORzD4QiHHBfLhkYAQcIIQ1TJ220EEbYMGA8jLHxLLPyFus5MBzxeRMeLJcQXIywVQBM8WWPoCE8tqzMkB+wCLAvhiiwL4ZPAD4IIQb4n141IQuuMCghDRNtOzUhC64wJsIQsMDQAuMDH4RAHHBfLhkfhFwADy4ZP4I/hl8AMAijD4QiHHBfLhkYIK+vCAcPsCgBBwghDVMnbbQQRtgwYDyMsfEss/IW6zkwHPF5Ex4slxBcjLBVAEzxZY+gITy2rMyQH7AAAgghBfzD0UupPywZ3ehA/y8AARPpEMHC68uFNgAgEgEBEANztRND6QAH4YvpAAfhh1AH4Y/pAAfhk0z8w+GWAALz4RfhDyPhCzxb4Qc8WzPhEzxbLP8ntVIAIBIBMYAgFYFBUADbVjHgBfCJACASAWFwANsB08AL4QYAANs2D8AL4RYAAZvH5/gBP7hFgXwhfCHC4EUpk="))
            .storeRef(data)
        .endCell()

        const tx: SendTransactionRequest = {
            validUntil: Math.round(Date.now() / 1000) + 60 * 5,
            messages: [
                {
                    address: new Address(0, state.hash()).toRawString(),
                    amount: '50000000',
                    stateInit: state.toBoc().toString('base64')      
                },
                {
                    address: jwAddress,
                    amount: '35000000',   
                    payload: jwPayload
                }
            ]
        };

        const result = await tonConnectUi.sendTransaction(tx, {
            modals: 'all',
            notifications: ['error']
        });
        
        const imMsgCell = Cell.fromBase64(result.boc);
        console.log(imMsgCell);
        

        try {
            // const tx = await waitForTx(inMsgHash);
            console.log(tx);
        } catch (e) {
            console.error('Error waiting for transaction:', e);
        }
    } catch (e) {
        console.error('Error sending transaction:', e);
    } finally {
        setTxInProgress(false);
    }
};
const isSubmitDisabled = !resultUrl;

  return (
    <div className="mint-ton-page">
      <BackButton />
      <h1>Mint SBT via $INFT</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label className="label">Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => handleChange(e)}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <p className="error-message">{errors.name}</p>}
        </div>
        <div>
          <label className="label">Description (optional):</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={(e) => handleChange(e)}
            className={errors.description ? 'error' : ''}
            style={{ height: '80px' }}
          />
          {errors.description && <p className="error-message">{errors.description}</p>}
        </div>
        <div>
          <label className="label">Image URL:</label>
          <input
            type="url"
            name="image"
            value={formData.image}
            onChange={(e) => handleChange(e)}
            className={errors.image ? 'error' : ''}
          />
          {errors.image && <p className="error-message">{errors.image}</p>}
        </div>
        <div>
          <label className="label">Content URL (optional):</label>
          <input
            type="url"
            name="content_url"
            value={formData.content_url || ''}
            onChange={(e) => handleChange(e)}
            className={errors.content_url ? 'error' : ''}
          />
          {errors.content_url && <p className="error-message">{errors.content_url}</p>}
        </div>
        <div className="toggle-section">
          <span className="section-title">Buttons</span>
          <button type="button" className="plus-button" onClick={() => formData.buttons.length < 3 && addField('buttons')}>+</button>
          <span className="count">{formData.buttons.length}</span>
          <button type="button" className="minus-button" onClick={() => formData.buttons.length > 0 && removeField('buttons', formData.buttons.length - 1)}>-</button>
        </div>
        {formData.buttons.length > 0 && (
          <div>
            {formData.buttons.map((btn, index) => (
              <div key={index}>
                <input
                  type="text"
                  name="label"
                  value={btn.label}
                  placeholder="Button Label"
                  onChange={(e) => handleChange(e, index, 'label', 'buttons')}
                />
                <input
                  type="url"
                  name="uri"
                  value={btn.uri}
                  placeholder="Button URL"
                  onChange={(e) => handleChange(e, index, 'uri', 'buttons')}
                  className={errors[`button_${index}_uri`] ? 'error' : ''}
                />
                {errors[`button_${index}_uri`] && <p className="error-message">{errors[`button_${index}_uri`]}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="toggle-section">
          <span className="section-title">Attributes</span>
          <button type="button" className="plus-button" onClick={() => formData.attributes.length < 10 && addField('attributes')}>+</button>
          <span className="count">{formData.attributes.length}</span>
          <button type="button" className="minus-button" onClick={() => formData.attributes.length > 0 && removeField('attributes', formData.attributes.length - 1)}>-</button>
        </div>
        {formData.attributes.length > 0 && (
          <div>
            {formData.attributes.map((attr, index) => (
              <div key={index}>
                <input
                  type="text"
                  name="trait_type"
                  value={attr.trait_type}
                  placeholder="Trait Type"
                  onChange={(e) => handleChange(e, index, 'trait_type', 'attributes')}
                />
                <input
                  type="text"
                  name="value"
                  value={attr.value}
                  placeholder="Value"
                  onChange={(e) => handleChange(e, index, 'value', 'attributes')}
                />
              </div>
            ))}
          </div>
        )}
        <button type="submit" className="submit-button">Send Data</button>
        <p>&nbsp;&nbsp;&nbsp;</p>
        {/* {resultUrl && <p>View on IPFS: <a href={resultUrl} target="_blank" rel="noopener noreferrer">{resultUrl}</a></p>} */}
        {uploadMessageVisible && resultUrl && <p className="upload">Successfully Uploaded!</p>}
        <p>&nbsp;&nbsp;&nbsp;</p>
      </form>
      <MainButton
                text="Mint SBT 🖼"
                onClick={onSendMintSbtSingle}
                color="#000000"
                textColor="#FFFFFF"
                disabled={isSubmitDisabled}
            />
    </div>
  );
};

export default MintInftPage;
